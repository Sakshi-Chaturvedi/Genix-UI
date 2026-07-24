import { IAIProvider } from "../../services/ai/providers/ai.provider.js";
import { IAIRequest, IAIResponse } from "../../types/ai.types.js";
import { classifyError, computeBackoff } from "./retry.strategy.js";
import {
  AuthenticationError,
  AllProvidersFailedError,
  ModelUnavailableError,
} from "./ai.errors.js";
import {
  OrchestrationMetricsCollector,
  IOrchestrationMetrics,
} from "./provider.metrics.js";
import logger from "../logger.js";
import aiConfig from "../../config/ai.config.js";

/**
 * Result returned by the orchestrator — includes both the AI response and the
 * full pipeline metrics (fallbacks, retries, latency, token usage, etc.).
 */
export interface IOrchestratedResult {
  response: IAIResponse;
  orchestrationMetrics: IOrchestrationMetrics;
}

/**
 * ProviderOrchestrator
 *
 * Owns the provider fallback, retry, and cooldown logic for the entire AI pipeline.
 * Responsibilities:
 *  - Iterate providers in configurable priority order.
 *  - Skip providers currently under cooldown due to rate limiting (HTTP 429).
 *  - Automatically retry within the active provider up to maxRetries before switching.
 *  - Handle backoff delays inside the active provider.
 *  - Track global statistics (successRate, latency, failures, cooldowns).
 *  - Throw AllProvidersFailedError if all providers fail.
 */
export class ProviderOrchestrator {
  private readonly providers: IAIProvider[];
  private readonly providerPriority: string[];

  // Global static state to track provider cooldowns (timestamp when cooldown ends)
  private static readonly cooldowns = new Map<string, number>();

  // Global static state to permanently disable misconfigured providers (e.g. 404, decommissioned)
  private static readonly disabledProviders = new Set<string>();

  // Global static state to track provider attempts and stats
  private static readonly providerAttemptsMap = new Map<string, Array<{
    success: boolean;
    latencyMs: number;
    retries: number;
  }>>();

  // Global static state to track provider cooldown activations
  private static readonly cooldownActivationsMap = new Map<string, number>();

  constructor(providers: IAIProvider[], providerPriority: string[]) {
    this.providers = providers;
    this.providerPriority = providerPriority;
  }

  /**
   * Cleans up expired cooldowns and logs that the cooldown ended.
   */
  private static cleanupCooldowns(): void {
    const now = Date.now();
    for (const [id, until] of ProviderOrchestrator.cooldowns.entries()) {
      if (now >= until) {
        ProviderOrchestrator.cooldowns.delete(id);
        logger.info(`[AI] Cooldown Ended: Provider '${id}' is now available again.`);
      }
    }
  }

  /**
   * Increments the cooldown activation count for a provider.
   */
  private static recordCooldownActivation(id: string): void {
    const count = ProviderOrchestrator.cooldownActivationsMap.get(id) || 0;
    ProviderOrchestrator.cooldownActivationsMap.set(id, count + 1);
  }

  /**
   * Returns global telemetry stats aggregated across all pipeline invocations.
   */
  public static getGlobalStats() {
    const stats: Record<string, any> = {};
    const allProviderIds = ["gemini", "openrouter", "groq", "openai"];

    for (const id of allProviderIds) {
      const attempts = ProviderOrchestrator.providerAttemptsMap.get(id) || [];
      const successes = attempts.filter(a => a.success);
      const failures = attempts.filter(a => !a.success);

      const totalAttempts = attempts.length;
      const successRate = totalAttempts > 0 ? Math.round((successes.length / totalAttempts) * 100) : 0;

      const totalLatency = successes.reduce((sum, a) => sum + a.latencyMs, 0);
      const avgLatencyMs = successes.length > 0 ? Math.round(totalLatency / successes.length) : 0;

      const totalRetries = attempts.reduce((sum, a) => sum + a.retries, 0);

      stats[id] = {
        successRate,
        avgLatencyMs,
        totalFailures: failures.length,
        cooldownActivations: ProviderOrchestrator.cooldownActivationsMap.get(id) || 0,
        totalRetries,
        totalAttempts,
      };
    }

    return stats;
  }

  /**
   * Executes the AI generation request against the priority-ordered provider chain.
   */
  public async execute(request: IAIRequest): Promise<IOrchestratedResult> {
    const orchestrationMetrics = new OrchestrationMetricsCollector();
    const providerErrors: Array<{ provider: string; error: Error }> = [];

    // Clean up expired cooldowns and log ended ones
    ProviderOrchestrator.cleanupCooldowns();

    // Resolve ordered list of providers (skipping active cooldowns)
    const orderedProviders = this.resolveProviderOrder();

    if (orderedProviders.length === 0) {
      // If all are in cooldown, clear cooldowns as a emergency fallback
      logger.warn("[Orchestrator] All providers are in cooldown. Resetting cooldowns to prevent complete outage.");
      ProviderOrchestrator.cooldowns.clear();
      return this.execute(request);
    }

    logger.info("[Orchestrator] Starting provider chain", {
      providerCount: orderedProviders.length,
      providerOrder: orderedProviders.map(p => p.id),
      feature: request.feature ?? "unknown",
    });

    const maxRetries = request.options?.retries ?? aiConfig.maxRetries;
    const baseDelayMs = aiConfig.retryBaseDelayMs;
    const maxDelayMs = aiConfig.retryMaxDelayMs;

    const promptLength = (request.prompt?.length || 0) + (request.systemInstruction?.length || 0);
    let adaptiveTimeoutMs = aiConfig.timeoutMs;
    if (request.feature === "page") {
      adaptiveTimeoutMs = 120000;
    } else if (promptLength > 2500) {
      adaptiveTimeoutMs = 90000;
    } else if (promptLength > 1000) {
      adaptiveTimeoutMs = 45000;
    } else {
      adaptiveTimeoutMs = 30000;
    }

    request.options = {
      ...request.options,
      timeout: Math.max(request.options?.timeout || 0, adaptiveTimeoutMs)
    };

    for (let i = 0; i < orderedProviders.length; i++) {
      const provider = orderedProviders[i];
      const isFallback = i > 0;

      if (isFallback) {
        logger.warn(`[AI] Switching Provider: ${orderedProviders[i - 1].id} -> ${provider.id}`, {
          failedProvider: orderedProviders[i - 1].id,
          nextProvider: provider.id,
          fallbackCount: i,
          previousError: providerErrors[providerErrors.length - 1]?.error?.message,
        });
      }

      logger.info(`[AI] Provider Selected: ${provider.id}`);

      let lastProviderError: any = null;
      let providerSuccess = false;
      let response: IAIResponse | null = null;
      let providerAttemptCount = 0;

      const totalAttempts = maxRetries + 1;

      for (let attempt = 1; attempt <= totalAttempts; attempt++) {
        providerAttemptCount = attempt;
        try {
          if (attempt > 1) {
            logger.warn(`[AI] Retry ${attempt - 1}/${maxRetries} for provider ${provider.id}`, {
              provider: provider.id,
              attempt,
              lastError: lastProviderError?.message,
            });
          }

          // Call provider.generate (which performs exactly 1 generation attempt now)
          response = await provider.generate(request);
          providerSuccess = true;
          break; // Success! Break the retry loop
        } catch (err: any) {
          lastProviderError = err;

          // ── AuthenticationError: abort provider chain immediately ─────────
          if (
            err?.name === "AuthenticationError" ||
            err?.statusCode === 401 ||
            err?.status === 401
          ) {
            logger.error(`[AI] Authentication failure on ${provider.id} — aborting provider chain`, err);
            // Record failed attempt for metrics
            orchestrationMetrics.recordAttempt({
              provider: provider.id,
              model: "unknown",
              latencyMs: 0,
              retryCount: attempt - 1,
              timedOut: false,
              success: false,
              errorName: err.name,
              errorMessage: err.message,
            });
            throw err;
          }

          if (err?.name === "ModelUnavailableError") {
            logger.error(`[AI] Model configured for ${provider.id} is unavailable or decommissioned — disabling provider`, err);
            ProviderOrchestrator.disabledProviders.add(provider.id);
            orchestrationMetrics.recordAttempt({
              provider: provider.id,
              model: "unknown",
              latencyMs: 0,
              retryCount: attempt - 1,
              timedOut: false,
              success: false,
              errorName: err.name,
              errorMessage: err.message,
            });
            break; // Do not retry, fall back to next provider
          }

          // Classify error to see if it is transient/retryable
          const { shouldRetry, reason } = classifyError(err);

          // If the failure is due to a rate limit (HTTP 429), trigger provider cooldown
          const status = err?.status ?? err?.statusCode ?? 0;
          const isRateLimit = status === 429 || (err?.message && (
            err.message.toLowerCase().includes("rate limit") ||
            err.message.toLowerCase().includes("quota") ||
            err.message.toLowerCase().includes("resource_exhausted")
          ));

          if (isRateLimit) {
            const cooldownDurationSec = Number(process.env.AI_COOLDOWN_DURATION_SEC ?? 60);
            const cooldownUntil = Date.now() + cooldownDurationSec * 1000;
            ProviderOrchestrator.cooldowns.set(provider.id, cooldownUntil);
            logger.warn(`[AI] Cooldown Started: Provider '${provider.id}' marked unavailable for ${cooldownDurationSec} seconds.`);
            ProviderOrchestrator.recordCooldownActivation(provider.id);
            
            // Do not retry the same provider; fall back to the next one immediately
            break;
          }

          logger.warn(`[AI] Attempt ${attempt} failed for provider ${provider.id}`, {
            provider: provider.id,
            errorName: err?.name,
            errorMessage: err?.message,
            retryable: shouldRetry,
            reason,
          });

          // Break the retry loop if error is not retryable
          if (!shouldRetry) {
            break;
          }

          // Backoff delay if we have more retries left
          if (attempt < totalAttempts) {
            const delayMs = computeBackoff(attempt, baseDelayMs, maxDelayMs);
            logger.info(`[AI] Backing off before retry on ${provider.id}`, {
              provider: provider.id,
              attempt,
              delayMs: Math.round(delayMs),
            });
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }

      // Record this provider's attempt result in the global stat maps
      const attempts = ProviderOrchestrator.providerAttemptsMap.get(provider.id) || [];
      attempts.push({
        success: providerSuccess,
        latencyMs: providerSuccess && response?.metadata?.latencyMs ? response.metadata.latencyMs : 0,
        retries: providerAttemptCount - 1,
      });
      ProviderOrchestrator.providerAttemptsMap.set(provider.id, attempts);

      if (providerSuccess && response) {
        // Success path
        const providerMetricsSnap = {
          provider: provider.id,
          model: response.metadata?.model ?? "unknown",
          latencyMs: response.metadata?.latencyMs ?? 0,
          retryCount: providerAttemptCount - 1,
          timedOut: false,
          success: true,
        };
        orchestrationMetrics.recordAttempt(providerMetricsSnap);
        orchestrationMetrics.recordTokenUsage(response.metadata?.tokensUsed ?? 0);

        const snap = orchestrationMetrics.snapshot();

        logger.info(`[AI] Provider Success: ${provider.id} succeeded. Latency: ${response.metadata?.latencyMs} ms`);

        // Enrich response with telemetry and global pipeline stats
        const enrichedResponse: IAIResponse = {
          ...response,
          metadata: {
            ...response.metadata,
            fallbackCount: snap.fallbackCount,
            retryCount: snap.totalRetryCount,
            providerSequence: snap.providerSequence,
            attempts: snap.attempts,
            pipelineStats: ProviderOrchestrator.getGlobalStats(),
          },
        };

        return { response: enrichedResponse, orchestrationMetrics: snap };
      } else {
        // Failure path for this provider
        orchestrationMetrics.recordAttempt({
          provider: provider.id,
          model: "unknown",
          latencyMs: 0,
          retryCount: providerAttemptCount - 1,
          timedOut: lastProviderError?.name === "AIProviderTimeoutError",
          success: false,
          errorName: lastProviderError?.name,
          errorMessage: lastProviderError?.message,
        });

        providerErrors.push({ provider: provider.id, error: lastProviderError });
      }
    }

    // All providers exhausted
    const failureReason = providerErrors
      .map(pe => `${pe.provider}: ${pe.error.message}`)
      .join(" | ");

    orchestrationMetrics.recordFailureReason(failureReason);

    logger.error("[Orchestrator] All providers exhausted", new Error("All providers failed"), {
      providerCount: orderedProviders.length,
      errors: providerErrors.map(pe => ({ provider: pe.provider, error: pe.error.message })),
    });

    throw new AllProvidersFailedError(providerErrors);
  }

  /**
   * Resolves the ordered list of available providers, filtering out ones in cooldown.
   */
  private resolveProviderOrder(): IAIProvider[] {
    const now = Date.now();
    const providerMap = new Map(this.providers.map(p => [p.id.toLowerCase(), p]));
    const ordered: IAIProvider[] = [];

    // Filter helper to check if a provider is in cooldown or disabled
    const isUnavailable = (id: string) => {
      if (ProviderOrchestrator.disabledProviders.has(id)) return true;
      const until = ProviderOrchestrator.cooldowns.get(id);
      return until !== undefined && until > now;
    };

    // Add providers in priority order if they are not unavailable
    for (const id of this.providerPriority) {
      const provider = providerMap.get(id);
      if (provider && !isUnavailable(provider.id)) {
        ordered.push(provider);
      }
    }

    // Append any registered providers not listed in priority order if they are not unavailable
    for (const provider of this.providers) {
      const alreadyAdded = ordered.some(p => p.id === provider.id);
      if (!alreadyAdded && !isUnavailable(provider.id)) {
        ordered.push(provider);
      }
    }

    return ordered;
  }
}

import { GoogleGenAI } from "@google/genai";
import { IAIProvider } from "./ai.provider.js";
import { IAIRequest, IAIResponse } from "../../../types/ai.types.js";
import { ResponseParser } from "../parsers/response.parser.js";
import aiConfig from "../../../config/ai.config.js";
import logger from "../../../utils/logger.js";
import { PromptOptimizer } from "../../../utils/ai/prompt.optimizer.js";
import { ProviderMetricsCollector } from "../../../utils/ai/provider.metrics.js";
import {
  AuthenticationError,
  AIProviderTimeoutError,
  InvalidAIResponseError,
} from "../../../utils/ai/ai.errors.js";
import { wrapProviderError } from "../../../utils/ai/retry.strategy.js";
import { performance } from "perf_hooks";

export class GeminiProvider implements IAIProvider {
  public readonly id = "gemini";

  public async generate(request: IAIRequest): Promise<IAIResponse> {
    // ── 1. Pre-flight: validate API key ─────────────────────────────────────
    const apiKey = aiConfig.providers.gemini.apiKey;
    if (!apiKey) {
      throw new AuthenticationError("Gemini API key is not configured.");
    }

    // ── 2. Resolve generation parameters from config ─────────────────────────
    const model         = aiConfig.providers.gemini.model;
    const temperature   = request.options?.temperature   ?? aiConfig.temperature;
    const maxOutputTokens = request.options?.maxTokens  ?? aiConfig.maxTokens;
    const timeoutMs     = request.options?.timeout       ?? aiConfig.timeoutMs;
    const minLength     = aiConfig.minResponseLength;
    const maxSizeBytes  = aiConfig.maxResponseSizeBytes;

    // ── 3. Prompt optimization ───────────────────────────────────────────────
    const systemInstruction = PromptOptimizer.optimizeSystemInstruction(request.systemInstruction);
    const userPrompt        = PromptOptimizer.optimizeUserPrompt(request.prompt) || "";

    // ── 4. Initialize metrics and SDK client ─────────────────────────────────
    const metrics = new ProviderMetricsCollector(this.id, model, request.feature);
    metrics.recordPrompt(systemInstruction + userPrompt);

    const client = new GoogleGenAI({ apiKey });

    const sdkConfig: any = {
      systemInstruction,
      temperature,
      maxOutputTokens,
      responseMimeType: "application/json",
    };

    if (model.includes("2.5") || model.includes("3.")) {
      sdkConfig.thinkingConfig = {
        thinkingBudget: 0,
      };
    }

    const reqStartTime = request.options?.startTime ?? performance.now();
    logger.info(`[5] Gemini request started - ${Math.round(performance.now() - reqStartTime)}ms`, {
      provider: this.id,
      model,
      timeoutMs,
    });

    // Hoisted so the catch block can log it for diagnosis
    let responseText = "";
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    try {
      const controller = new AbortController();
      const timeoutFired = { value: false };

      timeoutHandle = setTimeout(() => {
        timeoutFired.value = true;
        metrics.recordTimeout();
        controller.abort();
      }, timeoutMs);

      // ── 5. Invoke SDK ───────────────────────────────────────────────────
      let apiResult;
      try {
        apiResult = await client.models.generateContent({
          model,
          contents: userPrompt,
          config: sdkConfig,
        });
      } catch (sdkErr: any) {
        if (timeoutFired.value || sdkErr?.name === "AbortError") {
          throw new AIProviderTimeoutError(timeoutMs, this.id);
        }
        wrapProviderError(sdkErr, this.id, timeoutMs);
      } finally {
        clearTimeout(timeoutHandle);
      }

      logger.info(`[6] Gemini request completed - ${Math.round(performance.now() - reqStartTime)}ms`);

      // ── 6. Pre-parse response validation ───────────────────────────────
      responseText = apiResult!.text ?? "";
      logger.info(`[7] Raw response received - ${Math.round(performance.now() - reqStartTime)}ms`);
      const responseSizeBytes = Buffer.byteLength(responseText, "utf8");

      if (!responseText || responseText.trim().length === 0) {
        throw new InvalidAIResponseError("Gemini returned an empty response");
      }
      if (responseText.trim().length < minLength) {
        throw new InvalidAIResponseError(
          `Gemini response too short (${responseText.trim().length} chars, min ${minLength})`
        );
      }
      if (responseSizeBytes > maxSizeBytes) {
        throw new InvalidAIResponseError(
          `Gemini response exceeds max allowed size (${responseSizeBytes} bytes, max ${maxSizeBytes})`
        );
      }

      metrics.recordResponse(responseText);

      // ── 7. Parse response ──────────────────────────────────────────────
      const parsedData = ResponseParser.parse(responseText, this.id, model, reqStartTime);

      metrics.recordSuccess();
      const snap = metrics.snapshot();

      return {
        success: true,
        files: parsedData.files,
        explanation: parsedData.explanation,
        metadata: {
          latencyMs: snap.latencyMs,
          model,
          provider: this.id,
          tokensUsed: snap.estimatedTokensUsed,
          retryCount: 0, // Retries are handled by the orchestrator
        },
      };
    } catch (err: any) {
      clearTimeout(timeoutHandle);

      // Log the raw response whenever parsing fails so we can diagnose the exact
      // output shape that caused the extraction error without retrying blindly.
      if (
        err?.name === "JSONExtractionError" ||
        err?.name === "SchemaValidationError" ||
        err?.name === "InvalidAIResponseError"
      ) {
        logger.warn("[AI] Gemini parse failure — raw response logged for diagnosis", {
          provider: this.id,
          model,
          errorName: err.name,
          errorMessage: err.message,
          rawResponseLength: responseText?.length ?? 0,
          rawResponseSnippet: responseText?.slice(0, 800) ?? "(empty)",
        });
      }

      throw err;
    }
  } // end generate()

  /**
   * Lightweight health check — verifies API connectivity, auth, and model availability.
   * Does NOT run ResponseParser or enforce production min/max length rules.
   */
  public async healthCheck(): Promise<any> {
    const apiKey = aiConfig.providers.gemini.apiKey;
    const model = aiConfig.providers.gemini.model;

    if (!apiKey) {
      return { ok: false, model, latencyMs: 0, errorType: "Authentication Error", errorMessage: "Missing API key" };
    }

    const start = performance.now();

    try {
      const client = new GoogleGenAI({ apiKey });
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), 15000);

      let result: any;
      try {
        result = await client.models.generateContent({
          model,
          contents: "Say hello",
          // Use application/json (same as production) so the SDK path is identical
          config: { maxOutputTokens: 50, responseMimeType: "application/json" },
        });
      } finally {
        clearTimeout(timeoutHandle);
      }

      // Try multiple candidate paths the SDK may use
      const rawText: string =
        result?.text ??
        result?.candidates?.[0]?.content?.parts?.[0]?.text ??
        result?.candidates?.[0]?.output ??
        "";

      return {
        ok: rawText.trim().length > 0,
        model,
        latencyMs: Math.round(performance.now() - start),
        rawText,
        httpStatus: 200,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      const status: number = err?.status ?? err?.statusCode ?? err?.httpStatus ?? 0;

      // SDK may deliver error info in various shapes; capture everything useful
      let rawMessage: string =
        err?.message ??
        err?.errorDetails?.[0]?.reason ??
        err?.details ??
        (typeof err === "string" ? err : "");

      // If message is empty/undefined, stringify the whole error object for inspection
      if (!rawMessage || rawMessage.trim() === "" || rawMessage === "undefined") {
        try { rawMessage = JSON.stringify(err, Object.getOwnPropertyNames(err)); }
        catch { rawMessage = `SDK error (HTTP ${status || "unknown"})`; }
      }

      const lc = rawMessage.toLowerCase();
      let errorType = "Unknown Error";
      if (status === 401 || status === 403 || lc.includes("api key") || lc.includes("unauthorized")) errorType = "Authentication Error";
      else if (status === 404 || lc.includes("not found") || lc.includes("decommissioned")) errorType = "Model Not Found";
      else if (status === 429 || lc.includes("quota") || lc.includes("rate limit") || lc.includes("resource_exhausted")) errorType = "Quota Exceeded";
      else if (lc.includes("timeout") || err?.name === "AbortError") errorType = "Timeout";
      else if (status >= 500) errorType = "Provider Internal Error";

      return { ok: false, model, latencyMs, httpStatus: status || undefined, errorType, errorMessage: rawMessage };
    }
  } // end healthCheck()
}

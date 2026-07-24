/**
 * ProviderMetrics
 *
 * Captures and exposes telemetry for a single AI provider invocation.
 * Immutable snapshot returned after each generation attempt.
 */
export interface IProviderMetrics {
  /** Provider identifier (e.g. "gemini") */
  provider: string;
  /** Model identifier (e.g. "gemini-2.5-flash") */
  model: string;
  /** Total wall-clock time from first attempt to success/failure (ms) */
  latencyMs: number;
  /** Total number of retries made within this provider (not including initial attempt) */
  retryCount: number;
  /** Whether the request ultimately timed out */
  timedOut: boolean;
  /** Size of the raw response text in bytes (0 if no response received) */
  responseSizeBytes: number;
  /** Rough estimate of input + output tokens (character count / 4) */
  estimatedTokensUsed: number;
  /** Whether the invocation ultimately succeeded */
  success: boolean;
  /** The feature being invoked (generate, convert, improve, explain, page) */
  feature?: string;
  /** ISO timestamp of when the request was initiated */
  startedAt: string;
}

/**
 * Extended interface for orchestrator-level pipeline metrics (Phase 6).
 * Includes cross-provider telemetry not available from a single-provider run.
 */
export interface IOrchestrationMetrics {
  /** Total wall-clock time across all provider attempts (ms) */
  totalLatencyMs: number;
  /** Number of provider switches (0 = first provider succeeded) */
  fallbackCount: number;
  /** Total retries summed across all providers */
  totalRetryCount: number;
  /** Ordered list of providers that were attempted */
  providerSequence: string[];
  /** The provider that ultimately generated the successful response */
  providerUsed: string;
  /** Estimated total tokens used (prompt + response) */
  tokenUsage: number;
  /** Reason for failure if all providers exhausted */
  failureReason?: string;
  /** Per-provider attempt telemetry */
  attempts: IProviderAttemptRecord[];
}

/** Telemetry captured for a single provider's full attempt (including retries) */
export interface IProviderAttemptRecord {
  provider: string;
  model: string;
  latencyMs: number;
  retryCount: number;
  timedOut: boolean;
  success: boolean;
  errorName?: string;
  errorMessage?: string;
}

/**
 * Mutable builder collected during a single provider invocation.
 * Call `.snapshot()` to get the immutable `IProviderMetrics` record.
 */
export class ProviderMetricsCollector {
  private readonly provider: string;
  private readonly model: string;
  private readonly startTime: number;
  private readonly startedAt: string;
  private readonly feature?: string;

  private _retryCount = 0;
  private _timedOut = false;
  private _responseSizeBytes = 0;
  private _promptSizeBytes = 0;
  private _success = false;

  constructor(provider: string, model: string, feature?: string) {
    this.provider = provider;
    this.model = model;
    this.feature = feature;
    this.startTime = performance.now();
    this.startedAt = new Date().toISOString();
  }

  /** Call this each time a retry is about to occur (not on the first attempt). */
  public recordRetry(): void {
    this._retryCount++;
  }

  /** Call this when a timeout fires. */
  public recordTimeout(): void {
    this._timedOut = true;
  }

  /** Call this once a raw text response has been received. */
  public recordResponse(responseText: string): void {
    this._responseSizeBytes = Buffer.byteLength(responseText, "utf8");
  }

  /** Call this with the prompt that was sent. */
  public recordPrompt(promptText: string): void {
    this._promptSizeBytes = Buffer.byteLength(promptText, "utf8");
  }

  /** Call this on successful parse+validate completion. */
  public recordSuccess(): void {
    this._success = true;
  }

  /** Returns the elapsed wall-clock time in ms. */
  public get latencyMs(): number {
    return Math.round(performance.now() - this.startTime);
  }

  /**
   * Returns an immutable snapshot of the current metrics.
   */
  public snapshot(): IProviderMetrics {
    const totalChars = this._responseSizeBytes + this._promptSizeBytes;
    return {
      provider: this.provider,
      model: this.model,
      latencyMs: this.latencyMs,
      retryCount: this._retryCount,
      timedOut: this._timedOut,
      responseSizeBytes: this._responseSizeBytes,
      estimatedTokensUsed: Math.ceil(totalChars / 4), // 1 token ≈ 4 chars
      success: this._success,
      feature: this.feature,
      startedAt: this.startedAt,
    };
  }

  /**
   * Returns a serializable attempt record suitable for orchestrator telemetry.
   */
  public toAttemptRecord(errorName?: string, errorMessage?: string): IProviderAttemptRecord {
    return {
      provider: this.provider,
      model: this.model,
      latencyMs: this.latencyMs,
      retryCount: this._retryCount,
      timedOut: this._timedOut,
      success: this._success,
      errorName,
      errorMessage,
    };
  }
}

/**
 * OrchestrationMetricsCollector
 *
 * Aggregates telemetry across all provider attempts in the fallback chain.
 * The orchestrator creates one of these per request and accumulates per-provider
 * records as it walks through the priority list.
 */
export class OrchestrationMetricsCollector {
  private readonly startTime: number;
  private readonly attemptRecords: IProviderAttemptRecord[] = [];
  private _tokenUsage = 0;
  private _failureReason?: string;

  constructor() {
    this.startTime = performance.now();
  }

  /** Called after each provider attempt (succeeded or failed). */
  public recordAttempt(record: IProviderAttemptRecord): void {
    this.attemptRecords.push(record);
    // Accumulate token estimate from successful (or any) provider
    // Token estimation: 1 token ≈ 4 characters; kept simple for consistency
  }

  /** Update token usage when a provider succeeds. */
  public recordTokenUsage(tokens: number): void {
    this._tokenUsage = tokens;
  }

  /** Record the final failure reason if all providers exhaust. */
  public recordFailureReason(reason: string): void {
    this._failureReason = reason;
  }

  /**
   * Returns the fully aggregated orchestration metrics snapshot.
   */
  public snapshot(): IOrchestrationMetrics {
    const successful = this.attemptRecords.find(a => a.success);
    const providerSequence = this.attemptRecords.map(a => a.provider);
    const providerUsed = successful?.provider ?? providerSequence[providerSequence.length - 1] ?? "unknown";
    const fallbackCount = Math.max(0, this.attemptRecords.length - 1);
    const totalRetryCount = this.attemptRecords.reduce((sum, a) => sum + a.retryCount, 0);

    return {
      totalLatencyMs: Math.round(performance.now() - this.startTime),
      fallbackCount,
      totalRetryCount,
      providerSequence,
      providerUsed,
      tokenUsage: this._tokenUsage,
      failureReason: this._failureReason,
      attempts: [...this.attemptRecords],
    };
  }
}

import AppError from "../errorHandler.js";

// ─── Tier 1: Provider-level errors ────────────────────────────────────────────

/**
 * Thrown when the AI provider SDK call itself fails (network, generic error).
 */
export class AIProviderError extends AppError {
  constructor(message: string, statusCode = 502) {
    super(message, statusCode);
    this.name = "AIProviderError";
  }
}

/**
 * Thrown when the requested model is decommissioned, not found (404), or invalid.
 * NOT retryable — provider must be disabled for this process.
 */
export class ModelUnavailableError extends AppError {
  constructor(message: string) {
    super(message, 404);
    this.name = "ModelUnavailableError";
  }
}

/**
 * Thrown when the AI provider does not respond within the configured timeout.
 * Retryable — up to max retry limit.
 */
export class AIProviderTimeoutError extends AppError {
  public readonly timeoutMs: number;

  constructor(timeoutMs: number, provider = "unknown") {
    super(
      `AI provider '${provider}' did not respond within ${timeoutMs}ms`,
      504
    );
    this.name = "AIProviderTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Thrown when the AI provider is unavailable (503, 529, connection reset, etc.).
 * Retryable — transient infrastructure failure.
 */
export class ProviderUnavailableError extends AppError {
  public readonly providerStatus?: number;

  constructor(message: string, providerStatus?: number) {
    super(message, 503);
    this.name = "ProviderUnavailableError";
    this.providerStatus = providerStatus;
  }
}

// ─── Tier 2: Response-level errors ────────────────────────────────────────────

/**
 * Thrown when the AI provider returns an empty, whitespace-only, or too-short response.
 * Retryable — transient model failure.
 */
export class InvalidAIResponseError extends AppError {
  constructor(message = "Empty or invalid response received from AI provider") {
    super(message, 502);
    this.name = "InvalidAIResponseError";
  }
}

/**
 * Thrown when no valid JSON object can be extracted from the AI response text.
 * Retryable — model may have produced non-JSON output this attempt.
 */
export class JSONExtractionError extends AppError {
  public readonly rawSnippet: string;

  constructor(rawSnippet: string, message = "Failed to extract valid JSON from AI response") {
    super(message, 502);
    this.name = "JSONExtractionError";
    this.rawSnippet = rawSnippet.slice(0, 300);
  }
}

/**
 * Thrown when JSON is successfully extracted but fails Zod schema validation.
 * NOT retryable — the model produced structurally wrong output; retrying the
 * same prompt without changes is unlikely to fix this.
 */
export class SchemaValidationError extends AppError {
  public readonly validationErrors: string[];

  constructor(validationErrors: string[], message = "AI response JSON failed schema validation") {
    super(message, 502);
    this.name = "SchemaValidationError";
    this.validationErrors = validationErrors;
  }
}

// ─── Tier 3: Auth errors (never retried) ──────────────────────────────────────

/**
 * Thrown when the AI provider rejects the request due to authentication failure.
 * NOT retryable — changing key mid-flight won't fix the problem.
 */
export class AuthenticationError extends AppError {
  constructor(message = "AI provider authentication failed: invalid or missing API key") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

// ─── Tier 4: Retry exhaustion ─────────────────────────────────────────────────

/**
 * Thrown when all retry attempts have been exhausted without a successful parse.
 */
export class RetryLimitExceededError extends AppError {
  public readonly attempts: number;
  public readonly lastError: Error;

  constructor(attempts: number, lastError: Error) {
    super(
      `AI generation failed after ${attempts} attempt(s): ${lastError.message}`,
      502
    );
    this.name = "RetryLimitExceededError";
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

// ─── Tier 5: All providers failed (orchestrator-level) ────────────────────────

/**
 * Thrown by the ProviderOrchestrator when every provider in the priority chain
 * has been attempted and all have failed. Carries per-provider attempt detail.
 */
export class AllProvidersFailedError extends AppError {
  public readonly providerErrors: Array<{ provider: string; error: Error }>;

  constructor(providerErrors: Array<{ provider: string; error: Error }>) {
    const summary = providerErrors
      .map(pe => `${pe.provider}: ${pe.error.message}`)
      .join(" | ");
    super(`All AI providers failed. ${summary}`, 502);
    this.name = "AllProvidersFailedError";
    this.providerErrors = providerErrors;
  }
}

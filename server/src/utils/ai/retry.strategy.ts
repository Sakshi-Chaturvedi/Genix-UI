import {
  AIProviderTimeoutError,
  ProviderUnavailableError,
  AIProviderError,
  InvalidAIResponseError,
  JSONExtractionError,
  SchemaValidationError,
  AuthenticationError,
  RetryLimitExceededError,
  ModelUnavailableError,
} from "./ai.errors.js";

/**
 * HTTP status codes that indicate a transient, retryable condition.
 */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

/**
 * Error names that are NEVER retried regardless of attempt count.
 */
const NON_RETRYABLE_ERROR_NAMES = new Set([
  "AuthenticationError",
  "ModelUnavailableError",
  "SchemaValidationError", // Same prompt → same wrong schema; retrying is wasteful
  "JSONExtractionError",   // Extractor exhausts all repair strategies before throwing; retrying won't fix malformed output
]);

/**
 * Error names that are always retryable (transient failures).
 */
const RETRYABLE_ERROR_NAMES = new Set([
  "AIProviderTimeoutError",
  "ProviderUnavailableError",
  "InvalidAIResponseError",
]);

/**
 * Keywords in error messages that indicate a transient, retryable failure.
 */
const RETRYABLE_MESSAGE_FRAGMENTS = [
  "connection reset",
  "network timeout",
  "econnreset",
  "econnrefused",
  "fetch failed",
  "socket hang up",
  "epipe",
  "timed out",
  "gateway",
  "unavailable",
];

/**
 * Keywords in error messages that indicate a permanent, non-retryable failure.
 */
const NON_RETRYABLE_MESSAGE_FRAGMENTS = [
  "api key",
  "invalid key",
  "invalid request",
  "bad request",
  "malformed",
  "unsupported model",
  "invalid argument",
  "decommissioned",
  "not found",
  "no endpoints found"
];

export interface RetryDecision {
  shouldRetry: boolean;
  reason: string;
}

/**
 * Classifies an error as retryable or non-retryable.
 *
 * Decision priority:
 *  1. Auth errors → never retry
 *  2. Typed non-retryable errors → never retry
 *  3. Typed retryable errors → always retry
 *  4. HTTP status codes → retry if in RETRYABLE_STATUS_CODES
 *  5. Message fragment matching → retry if message suggests transient failure
 *  6. Unknown errors → do NOT retry (fail-safe)
 */
export function classifyError(err: any): RetryDecision {
  const name: string = err?.name ?? "";
  const message: string = (err?.message ?? String(err)).toLowerCase();
  const status: number = err?.status ?? err?.statusCode ?? 0;

  // 1. Always non-retryable: auth errors
  if (name === "AuthenticationError" || status === 401) {
    return { shouldRetry: false, reason: "Authentication failure is permanent" };
  }

  // 2. Typed non-retryable errors
  if (NON_RETRYABLE_ERROR_NAMES.has(name)) {
    return { shouldRetry: false, reason: `${name} is non-retryable` };
  }

  // 3. Typed retryable errors
  if (RETRYABLE_ERROR_NAMES.has(name)) {
    return { shouldRetry: true, reason: `${name} is a transient failure` };
  }

  // 4. HTTP status code classification
  if (status > 0) {
    if (RETRYABLE_STATUS_CODES.has(status)) {
      return { shouldRetry: true, reason: `HTTP ${status} is a transient error` };
    }
    if (status >= 400 && status < 500) {
      return { shouldRetry: false, reason: `HTTP ${status} is a client error (non-retryable)` };
    }
  }

  // 5. Message fragment matching — non-retryable takes priority
  for (const fragment of NON_RETRYABLE_MESSAGE_FRAGMENTS) {
    if (message.includes(fragment)) {
      return { shouldRetry: false, reason: `Message indicates non-retryable failure: "${fragment}"` };
    }
  }
  for (const fragment of RETRYABLE_MESSAGE_FRAGMENTS) {
    if (message.includes(fragment)) {
      return { shouldRetry: true, reason: `Message indicates transient failure: "${fragment}"` };
    }
  }

  // 6. Fail-safe: unknown error → do not retry
  return { shouldRetry: false, reason: "Unknown error — not retrying (fail-safe)" };
}

/**
 * Computes exponential backoff delay with random jitter.
 *
 * Formula: baseDelayMs * 2^(attempt-1) + jitter
 * Jitter: random value in [0, baseDelayMs] to avoid retry storms.
 * Cap: the result is always ≤ maxDelayMs.
 *
 * @param attempt - Current attempt number (1-indexed)
 * @param baseDelayMs - Base delay in ms (from config)
 * @param maxDelayMs - Maximum cap in ms
 */
export function computeBackoff(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  const exponential = baseDelayMs * Math.pow(2, attempt - 1);
  const jitter = Math.random() * baseDelayMs;
  return Math.min(exponential + jitter, maxDelayMs);
}

/**
 * Wraps a raw provider error into the appropriate typed AI error class.
 * Used for errors that originate directly from the SDK (not from parsing).
 */
export function wrapProviderError(
  err: any,
  provider: string,
  timeoutMs: number
): never {
  // Preserve original message and status — never lose diagnostic context.
  const rawMessage: string = err?.message ?? String(err);
  const message: string = rawMessage.toLowerCase();
  const status: number = err?.status ?? err?.statusCode ?? 0;

  // ── 401 / 403 authentication ─────────────────────────────────────────────
  if (
    status === 401 ||
    status === 403 ||
    message.includes("api key") ||
    message.includes("invalid key") ||
    message.includes("unauthorized")
  ) {
    throw new AuthenticationError(
      `Authentication failed for provider '${provider}': ${rawMessage}`
    );
  }

  // ── 404 / model not found / decommissioned ───────────────────────────────
  if (
    status === 404 ||
    message.includes("decommissioned") ||
    message.includes("no endpoints found") ||
    message.includes("model_not_found") ||
    message.includes("model not found")
  ) {
    throw new ModelUnavailableError(
      `Model unavailable for provider '${provider}': ${rawMessage}`
    );
  }

  // ── 400 bad request ───────────────────────────────────────────────────────
  if (status === 400) {
    throw new AIProviderError(
      `Provider '${provider}' rejected the request (400): ${rawMessage}`,
      400
    );
  }

  // ── 429 rate-limit / quota ───────────────────────────────────────────────
  if (
    status === 429 ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("resource_exhausted")
  ) {
    throw new AIProviderError(
      `Rate limit exceeded for provider '${provider}'. Please retry after the quota resets.`,
      429
    );
  }

  // ── 503 / 529 service unavailable ────────────────────────────────────────
  if (
    status === 503 ||
    status === 529 ||
    message.includes("service unavailable") ||
    message.includes("overloaded")
  ) {
    throw new ProviderUnavailableError(
      `Provider '${provider}' is temporarily unavailable (${status || 503}): ${rawMessage}`,
      status || 503
    );
  }

  // ── Timeout ───────────────────────────────────────────────────────────────
  if (
    err?.name === "AIProviderTimeoutError" ||
    message.includes("timed out") ||
    message.includes("timeout")
  ) {
    throw new AIProviderTimeoutError(timeoutMs, provider);
  }

  // ── True upstream 5xx (500 / 502 / 504) ──────────────────────────────────
  if (status === 500 || status === 502 || status === 504) {
    throw new ProviderUnavailableError(
      `Provider '${provider}' returned upstream HTTP ${status}: ${rawMessage}`,
      status
    );
  }

  // ── Catch-all: preserve original status, never silently use 502 ──────────
  throw new AIProviderError(
    `Provider '${provider}' failed: ${rawMessage}`,
    status >= 400 ? status : 502
  );
}

export {
  AIProviderTimeoutError,
  ProviderUnavailableError,
  AIProviderError,
  InvalidAIResponseError,
  JSONExtractionError,
  SchemaValidationError,
  AuthenticationError,
  RetryLimitExceededError,
  ModelUnavailableError,
};

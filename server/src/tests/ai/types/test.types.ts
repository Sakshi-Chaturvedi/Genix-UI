// ─── Shared type definitions for the AI Regression Test Framework ───────────

export type AIFeature = "generate" | "convert" | "improve" | "explain" | "page";

export interface IPromptCase {
  id: string;
  name: string;
  feature: AIFeature;
  endpoint: string;
  body: Record<string, unknown>;
  ruleSet: string;
}

export interface IQualityWeights {
  accessibility: number;  // max 20
  typing: number;         // max 20
  architecture: number;   // max 20
  styling: number;        // max 20
  responsiveness: number; // max 20
}

export interface IRuleSet {
  mustContain: string[];
  mustNotContain: string[];
  accessibilityRules: string[];
  architectureRules: string[];
  stylingRules: string[];
  typescriptRules: string[];
  qualityWeights: IQualityWeights;
}

export interface IQualityScore {
  accessibility: number;
  typing: number;
  architecture: number;
  styling: number;
  responsiveness: number;
  total: number;
  percentage: number;
}

export interface IValidationResult {
  structureValid: boolean;
  structureErrors: string[];
  qualityPassed: string[];
  qualityFailed: string[];
  qualityScore: IQualityScore;
}

export interface ITestResult {
  id: string;
  name: string;
  feature: AIFeature;
  passed: boolean;
  latencyMs: number;
  provider: string;
  model: string;
  promptVersion: string;
  filesGenerated: number;
  validation: IValidationResult;
  error?: string;
  timestamp: string;
  /** Number of provider switches that occurred (0 = first provider succeeded) */
  fallbackCount?: number;
  /** Total retries across all providers */
  retryCount?: number;
  /** Ordered list of providers attempted */
  providerSequence?: string[];
  /** Detailed attempts for this test */
  attempts?: any[];
  /** Global pipeline statistics from the server */
  pipelineStats?: Record<string, {
    successRate: number;
    avgLatencyMs: number;
    totalFailures: number;
    cooldownActivations: number;
    totalRetries: number;
    totalAttempts: number;
  }>;
  /**
   * Human-readable primary failure reason for this test.
   * Derived from the first failed provider attempt's errorMessage (if HTTP/provider
   * failure) or the first entry in validation.qualityFailed (if quality failure).
   * Empty string when the test passed.
   */
  failureReason?: string;
}

export interface ITestSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  averageLatencyMs: number;
  averageQualityScore: number;
  totalDurationMs: number;
  /** Sum of all provider fallbacks across all tests */
  totalFallbackCount: number;
  /** Sum of all retries across all tests */
  totalRetryCount: number;

  // ── Latency percentiles (computed from per-test latencyMs samples) ────────
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;

  // ── Rates ─────────────────────────────────────────────────────────────────
  /** Percentage of tests that required at least one provider fallback */
  fallbackRate: number;
  /** Percentage of tests that had at least one retry */
  retryRate: number;

  // ── Distribution maps ─────────────────────────────────────────────────────
  /**
   * Count of tests served by each provider (keyed by provider id).
   * Only counts the provider that ultimately answered (ITestResult.provider).
   */
  providerDistribution: Record<string, number>;
  /**
   * Count of tests that failed for each failure category.
   * Possible keys: "structure", "accessibility", "typing", "architecture",
   * "styling", "responsiveness", "provider"
   */
  failureDistribution: Record<string, number>;
}

export interface ITestReport {
  runId: string;
  timestamp: string;
  config: {
    apiBaseUrl: string;
    provider: string;
    model: string;
    /** Delay (ms) inserted between test cases */
    delayBetweenTestsMs?: number;
  };
  summary: ITestSummary;
  results: ITestResult[];
}

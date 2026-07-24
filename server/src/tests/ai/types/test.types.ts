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

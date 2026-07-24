export interface IGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retries?: number;
  startTime?: number;
}

export interface IGeneratedFile {
  path: string;
  content: string;
  type: "code" | "style" | "test" | "storybook" | "documentation" | "config";
  language: string;
}

export interface IGenerationMetadata {
  tokensUsed?: number;
  latencyMs?: number;
  model?: string;
  provider?: string;
  promptVersion?: string;
  /** Total retries across all providers */
  retryCount?: number;
  /** Number of provider switches that occurred */
  fallbackCount?: number;
  /** Ordered list of providers that were attempted */
  providerSequence?: string[];
  /** Reason for ultimate failure (if any) */
  failureReason?: string;
  /** Per-provider attempt records from the orchestrator */
  attempts?: IFallbackAttempt[];
  /** Full pipeline stats snapshot */
  pipelineStats?: Record<string, any>;
}

/** Single-provider attempt record stored by the orchestrator */
export interface IFallbackAttempt {
  provider: string;
  model: string;
  latencyMs: number;
  retryCount: number;
  timedOut: boolean;
  errorName?: string;
  errorMessage?: string;
}

/** Aggregated pipeline-level metrics returned by the orchestrator */
export interface IPipelineMetrics {
  totalLatencyMs: number;
  fallbackCount: number;
  totalRetryCount: number;
  providerSequence: string[];
  providerUsed: string;
  tokenUsage: number;
  failureReason?: string;
  attempts: IFallbackAttempt[];
}

export interface IAIRequest {
  prompt?: string;
  code?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  systemInstruction?: string;
  options?: IGenerationOptions;
  feature?: "generate" | "convert" | "improve" | "explain" | "page";
}

export interface IAIResponse {
  success: boolean;
  files: IGeneratedFile[];
  explanation?: string;
  metadata?: IGenerationMetadata;
  error?: string;
}

export interface IProviderResult {
  success: boolean;
  files: IGeneratedFile[];
  explanation?: string;
  metadata?: IGenerationMetadata;
  error?: string;
}

export interface IGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retries?: number;
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
}

export interface IAIRequest {
  prompt: string;
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

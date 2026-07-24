import dotenv from "dotenv";

dotenv.config();

export interface ProviderConfig {
  apiKey?: string;
  model: string;
  endpoint?: string;
}

export interface AIConfig {
  defaultProvider: keyof AIConfig["providers"];
  /** Ordered list of provider IDs to try, from highest to lowest priority */
  providerPriority: string[];
  timeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  retryMaxDelayMs: number;
  maxTokens: number;
  temperature: number;
  minResponseLength: number;
  maxResponseSizeBytes: number;
  providers: {
    gemini: ProviderConfig;
    groq: ProviderConfig;
    openai: ProviderConfig;
    claude: ProviderConfig;
    openrouter: ProviderConfig;
  };
}

export const aiConfig: AIConfig = {
  defaultProvider:
    (process.env.AI_DEFAULT_PROVIDER as keyof AIConfig["providers"]) ||
    "gemini",

  // ─── Provider Priority ──────────────────────────────────────────────────────
  // Comma-separated list of provider IDs in fallback order.
  // Example: AI_PROVIDER_PRIORITY=gemini,openrouter,groq,openai
  providerPriority: (
    process.env.AI_PROVIDER_PRIORITY ?? "gemini,openrouter,groq,openai"
  ).split(",").map(p => p.trim().toLowerCase()).filter(Boolean),

  // How long (ms) to wait for a single AI API response before aborting.
  timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 45000),

  // ─── Retry ──────────────────────────────────────────────────────────────────
  // Maximum number of ADDITIONAL attempts after the first (total = maxRetries + 1).
  maxRetries: Number(process.env.AI_MAX_RETRIES ?? 3),

  // Base delay (ms) for exponential backoff. Actual delay = base * 2^attempt + jitter.
  retryBaseDelayMs: Number(process.env.AI_RETRY_BASE_DELAY_MS ?? 1000),

  // Maximum delay cap (ms) between retry attempts.
  retryMaxDelayMs: Number(process.env.AI_RETRY_MAX_DELAY_MS ?? 16000),

  // ─── Generation ─────────────────────────────────────────────────────────────
  maxTokens: Number(process.env.AI_MAX_TOKENS ?? 8192),

  temperature: Number(process.env.AI_TEMPERATURE ?? 0.2),

  // ─── Response Validation ────────────────────────────────────────────────────
  // Minimum character count a response must have to be considered non-empty.
  minResponseLength: Number(process.env.AI_MIN_RESPONSE_LENGTH ?? 50),

  // Maximum allowed response size in bytes. Responses larger than this are rejected.
  maxResponseSizeBytes: Number(process.env.AI_MAX_RESPONSE_SIZE_BYTES ?? 524288), // 512 KB

  // ─── Providers ──────────────────────────────────────────────────────────────
  providers: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    },

    groq: {
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
    },

    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
    },

    claude: {
      apiKey: process.env.CLAUDE_API_KEY,
      model: process.env.CLAUDE_MODEL ?? "claude-3-5-sonnet",
    },

    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      model:
        process.env.OPENROUTER_MODEL ??
        "meta-llama/llama-3.1-70b-instruct",
      endpoint:
        process.env.OPENROUTER_ENDPOINT ??
        "https://openrouter.ai/api/v1",
    },
  },
};


console.log("========== AI CONFIG ==========");
console.log("Gemini:", aiConfig.providers.gemini.model);
console.log("OpenRouter:", aiConfig.providers.openrouter.model);
console.log("Groq:", aiConfig.providers.groq.model);
console.log("OpenAI:", aiConfig.providers.openai.model);
console.log("Priority:", aiConfig.providerPriority);
console.log("===============================");

export default aiConfig;
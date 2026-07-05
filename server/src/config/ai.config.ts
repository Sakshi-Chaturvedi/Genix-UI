import dotenv from "dotenv";

dotenv.config();

export interface ProviderConfig {
  apiKey?: string;
  model: string;
  endpoint?: string;
}

export interface AIConfig {
  defaultProvider: keyof AIConfig["providers"];
  timeoutMs: number;
  maxRetries: number;
  maxTokens: number;
  temperature: number;
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

  timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 30000),

  maxRetries: Number(process.env.AI_MAX_RETRIES ?? 3),

  maxTokens: Number(process.env.AI_MAX_TOKENS ?? 4096),

  temperature: Number(process.env.AI_TEMPERATURE ?? 0.2),

  providers: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    },

    groq: {
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL ?? "llama3-8b-8192",
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
        "meta-llama/llama-3-70b-instruct",
      endpoint:
        process.env.OPENROUTER_ENDPOINT ??
        "https://openrouter.ai/api/v1",
    },
  },
};

export default aiConfig;
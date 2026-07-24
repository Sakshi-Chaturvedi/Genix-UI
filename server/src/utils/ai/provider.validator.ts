import logger from "../logger.js";
import aiConfig from "../../config/ai.config.js";
import fetch from "node-fetch"; // Or rely on global fetch if Node 18+

export async function validateProvidersOnStartup() {
  logger.info("[Startup] Validating AI Provider configurations...");
  
  const providers = aiConfig.providers;
  
  // Gemini
  await validateProvider(
    "gemini", 
    providers.gemini.model, 
    providers.gemini.apiKey, 
    async (model, apiKey) => {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${apiKey}`);
      if (!res.ok) {
        const errorText = await res.text();
        return { valid: false, reason: `HTTP ${res.status}: ${errorText}` };
      }
      return { valid: true };
    }
  );

  // OpenAI
  await validateProvider(
    "openai", 
    providers.openai.model, 
    providers.openai.apiKey, 
    async (model, apiKey) => {
      const res = await fetch(`https://api.openai.com/v1/models/${model}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (!res.ok) {
        const errorText = await res.text();
        return { valid: false, reason: `HTTP ${res.status}: ${errorText}` };
      }
      return { valid: true };
    }
  );

  // Groq
  await validateProvider(
    "groq", 
    providers.groq.model, 
    providers.groq.apiKey, 
    async (model, apiKey) => {
      const res = await fetch(`https://api.groq.com/openai/v1/models/${model}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (!res.ok) {
        const errorText = await res.text();
        return { valid: false, reason: `HTTP ${res.status}: ${errorText}` };
      }
      return { valid: true };
    }
  );

  // OpenRouter
  await validateProvider(
    "openrouter", 
    providers.openrouter.model, 
    providers.openrouter.apiKey, 
    async (model, apiKey) => {
      const res = await fetch(`https://openrouter.ai/api/v1/models`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (!res.ok) {
        const errorText = await res.text();
        return { valid: false, reason: `HTTP ${res.status}: ${errorText}` };
      }
      const json = await res.json() as any;
      const found = json.data?.find((m: any) => m.id === model);
      if (!found) {
        return { valid: false, reason: `Model ${model} not found in OpenRouter models list.` };
      }
      return { valid: true };
    }
  );
}

async function validateProvider(
  name: string,
  model: string,
  apiKey: string | undefined,
  validator: (model: string, apiKey: string) => Promise<{ valid: boolean, reason?: string }>
) {
  try {
    if (!apiKey) {
      logger.error(`[Startup] Provider: ${name} | Model: ${model} | Usable: ✗ | Reason: Missing API Key`);
      return;
    }
    const result = await validator(model, apiKey);
    if (result.valid) {
      logger.info(`[Startup] Provider: ${name} | Model: ${model} | Usable: ✓`);
    } else {
      logger.error(`[Startup] Provider: ${name} | Model: ${model} | Usable: ✗ | Reason: ${result.reason}`);
    }
  } catch (error: any) {
    logger.error(`[Startup] Provider: ${name} | Model: ${model} | Usable: ✗ | Reason: Network/Internal Error: ${error.message}`);
  }
}

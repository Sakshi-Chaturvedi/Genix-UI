import { IAIProvider } from "./providers/ai.provider.js";
import { GeminiProvider } from "./providers/gemini.provider.js";
import { OpenRouterProvider } from "./providers/openrouter.provider.js";
import { GroqProvider } from "./providers/groq.provider.js";
import { OpenAIProvider } from "./providers/openai.provider.js";
import { IAIRequest, IAIResponse } from "../../types/ai.types.js";
import { PromptBuilder } from "./builders/prompt.builder.js";
import { ProviderOrchestrator } from "../../utils/ai/provider.orchestrator.js";
import aiConfig from "../../config/ai.config.js";
import AppError from "../../utils/errorHandler.js";
import logger from "../../utils/logger.js";
import { performance } from "perf_hooks";

/**
 * AIService
 *
 * Builds prompts for each feature and delegates generation to the
 * ProviderOrchestrator which owns the fallback + retry chain.
 *
 * None of the public methods contain provider-specific logic — they only
 * build the prompt and forward it through the orchestrator.
 */
export class AIService {
  private orchestrator: ProviderOrchestrator;
  private promptBuilder: PromptBuilder;

  constructor(orchestrator: ProviderOrchestrator) {
    this.orchestrator = orchestrator;
    this.promptBuilder = new PromptBuilder();
  }

  public async generateComponent(request: IAIRequest): Promise<IAIResponse> {
    const startTime = request.options?.startTime ?? performance.now();
    logger.info(`[4] AI service entered - ${Math.round(performance.now() - startTime)}ms`);

    const builtPrompt = this.promptBuilder.build("component", {
      prompt: request.prompt || "",
    });
    logger.info(`[3] Prompt built - ${Math.round(performance.now() - startTime)}ms`);

    const { response } = await this.orchestrator.execute({
      prompt: builtPrompt.userPrompt,
      systemInstruction: builtPrompt.systemPrompt,
      options: request.options,
      feature: "generate",
    });

    return {
      ...response,
      metadata: {
        ...response.metadata,
        promptVersion: builtPrompt.version,
      },
    };
  }

  public async convertJsToTs(request: IAIRequest): Promise<IAIResponse> {
    const builtPrompt = this.promptBuilder.build("conversion", {
      code: request.code || "",
      sourceLanguage: request.sourceLanguage || "javascript",
      targetLanguage: request.targetLanguage || "typescript",
    });

    const { response } = await this.orchestrator.execute({
      prompt: builtPrompt.userPrompt,
      systemInstruction: builtPrompt.systemPrompt,
      options: request.options,
      feature: "convert",
    });

    return {
      ...response,
      metadata: {
        ...response.metadata,
        promptVersion: builtPrompt.version,
      },
    };
  }

  public async improveComponent(request: IAIRequest): Promise<IAIResponse> {
    const builtPrompt = this.promptBuilder.build("improvement", {
      code: request.code || "",
      prompt: request.prompt || "",
    });

    const { response } = await this.orchestrator.execute({
      prompt: builtPrompt.userPrompt,
      systemInstruction: builtPrompt.systemPrompt,
      options: request.options,
      feature: "improve",
    });

    return {
      ...response,
      metadata: {
        ...response.metadata,
        promptVersion: builtPrompt.version,
      },
    };
  }

  public async explainComponent(request: IAIRequest): Promise<IAIResponse> {
    const builtPrompt = this.promptBuilder.build("explanation", {
      code: request.code || "",
    });

    const { response } = await this.orchestrator.execute({
      prompt: builtPrompt.userPrompt,
      systemInstruction: builtPrompt.systemPrompt,
      options: request.options,
      feature: "explain",
    });

    return {
      ...response,
      metadata: {
        ...response.metadata,
        promptVersion: builtPrompt.version,
      },
    };
  }

  public async generatePage(request: IAIRequest): Promise<IAIResponse> {
    const builtPrompt = this.promptBuilder.build("page", {
      prompt: request.prompt || "",
    });

    const { response } = await this.orchestrator.execute({
      prompt: builtPrompt.userPrompt,
      systemInstruction: builtPrompt.systemPrompt,
      options: request.options,
      feature: "page",
    });

    return {
      ...response,
      metadata: {
        ...response.metadata,
        promptVersion: builtPrompt.version,
      },
    };
  }
}

// ─── Provider Registry ────────────────────────────────────────────────────────

export class AIProviderFactory {
  private static providers = new Map<string, IAIProvider>();

  public static registerProvider(name: string, provider: IAIProvider): void {
    this.providers.set(name.toLowerCase(), provider);
  }

  public static getProvider(name: string): IAIProvider {
    const providerName = name.toLowerCase();
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new AppError(`AI Provider '${name}' is not registered or supported.`, 400);
    }
    return provider;
  }

  /** Returns all registered providers in registration order. */
  public static getAllProviders(): IAIProvider[] {
    return Array.from(this.providers.values());
  }
}

// ─── Default Provider Registration ───────────────────────────────────────────
// Only Gemini is shipped out-of-the-box. Additional providers (OpenRouter, Groq,
// OpenAI) can be registered here once their provider classes are implemented.
AIProviderFactory.registerProvider("gemini", new GeminiProvider());
AIProviderFactory.registerProvider("openrouter", new OpenRouterProvider());
AIProviderFactory.registerProvider("groq", new GroqProvider());
AIProviderFactory.registerProvider("openai", new OpenAIProvider());

// ─── Default Orchestrator Factory ────────────────────────────────────────────

/**
 * Creates a ProviderOrchestrator wired with all registered providers
 * and the configured priority order from aiConfig.
 */
export function createOrchestrator(): ProviderOrchestrator {
  const providers = AIProviderFactory.getAllProviders();
  return new ProviderOrchestrator(providers, aiConfig.providerPriority);
}

import { IAIProvider } from "./providers/ai.provider.js";
import { GeminiProvider } from "./providers/gemini.provider.js";
import { IAIRequest, IAIResponse } from "../../types/ai.types.js";
import { PromptBuilder } from "./builders/prompt.builder.js";
import AppError from "../../utils/errorHandler.js";

export class AIService {
  private provider: IAIProvider;
  private promptBuilder: PromptBuilder;

  constructor(provider: IAIProvider) {
    this.provider = provider;
    this.promptBuilder = new PromptBuilder();
  }

  public async generateComponent(request: IAIRequest): Promise<IAIResponse> {
    const builtPrompt = this.promptBuilder.build("component", {
      prompt: request.prompt || "",
    });

    const response = await this.provider.generate({
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

    const response = await this.provider.generate({
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

    const response = await this.provider.generate({
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

    const response = await this.provider.generate({
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

    const response = await this.provider.generate({
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
}

// Automatically register default providers
AIProviderFactory.registerProvider("gemini", new GeminiProvider());

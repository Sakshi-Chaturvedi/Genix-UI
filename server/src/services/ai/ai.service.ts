import { IAIProvider } from "./providers/ai.provider.js";
import { GeminiProvider } from "./providers/gemini.provider.js";
import { IAIRequest, IAIResponse } from "../../types/ai.types.js";
import AppError from "../../utils/errorHandler.js";

export class AIService {
  private provider: IAIProvider;

  constructor(provider: IAIProvider) {
    this.provider = provider;
  }

  public async generateComponent(request: IAIRequest): Promise<IAIResponse> {
    return this.provider.generate({
      ...request,
      feature: "generate",
    });
  }

  public async convertJsToTs(request: IAIRequest): Promise<IAIResponse> {
    return this.provider.generate({
      ...request,
      feature: "convert",
    });
  }

  public async improveComponent(request: IAIRequest): Promise<IAIResponse> {
    return this.provider.generate({
      ...request,
      feature: "improve",
    });
  }

  public async explainComponent(request: IAIRequest): Promise<IAIResponse> {
    return this.provider.generate({
      ...request,
      feature: "explain",
    });
  }

  public async generatePage(request: IAIRequest): Promise<IAIResponse> {
    return this.provider.generate({
      ...request,
      feature: "page",
    });
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

import { GoogleGenAI } from "@google/genai";
import { IAIProvider } from "./ai.provider.js";
import { IAIRequest, IAIResponse } from "../../../types/ai.types.js";
import { RESPONSE_SCHEMA } from "../prompts/system.prompt.js";
import { ResponseParser } from "../parsers/response.parser.js";
import aiConfig from "../../../config/ai.config.js";
import AppError from "../../../utils/errorHandler.js";
import logger from "../../../utils/logger.js";

export class GeminiProvider implements IAIProvider {
  public readonly id = "gemini";

  public async generate(request: IAIRequest): Promise<IAIResponse> {
    const apiKey = aiConfig.providers.gemini.apiKey;
    if (!apiKey) {
      throw new AppError("Gemini API key is not configured.", 401);
    }

    const client = new GoogleGenAI({ apiKey });
    const model = aiConfig.providers.gemini.model;
    const temperature = request.options?.temperature ?? aiConfig.temperature;
    const maxOutputTokens = request.options?.maxTokens ?? aiConfig.maxTokens;
    const timeoutMs = request.options?.timeout ?? aiConfig.timeoutMs;
    const maxRetries = request.options?.retries ?? aiConfig.maxRetries;

    const systemInstruction = request.systemInstruction;
    const userPrompt = request.prompt || "";

    const apiConfig = {
      systemInstruction,
      temperature,
      maxOutputTokens,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    };

    const startTime = performance.now();
    let responseText = "";
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const apiCall = client.models.generateContent({
          model,
          contents: userPrompt,
          config: apiConfig,
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new AppError("AI provider request timed out", 504));
          }, timeoutMs);
        });

        const apiResult = await Promise.race([apiCall, timeoutPromise]);
        
        responseText = apiResult.text || "";
        if (!responseText) {
          throw new AppError("Empty response received from AI provider", 502);
        }
        
        lastError = null;
        break;
      } catch (err: any) {
        lastError = err;
        logger.warn(`Gemini API call attempt ${attempt} failed: ${err.message || err}`);
        
        const isAuthError = 
          err.message?.includes("API key") || 
          err.statusCode === 401 || 
          err.status === 401;
          
        if (isAuthError) {
          break;
        }

        if (attempt <= maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    const latencyMs = Math.round(performance.now() - startTime);

    if (lastError) {
      logger.error("Gemini Provider execution failed", lastError, {
        provider: this.id,
        model,
        latencyMs,
        success: false,
      });

      const errMsg = lastError.message || String(lastError);
      if (errMsg.includes("API key") || errMsg.includes("invalid key") || lastError.status === 401) {
        throw new AppError("Authentication failed: Invalid Gemini API key", 401);
      }
      if (errMsg.includes("quota") || errMsg.includes("rate limit") || lastError.status === 429) {
        throw new AppError("Rate limit exceeded for Gemini API", 429);
      }
      if (errMsg.includes("timed out")) {
        throw new AppError("Gemini API request timed out", 504);
      }
      throw new AppError(`Gemini Generation failed: ${errMsg}`, 502);
    }

    // Delegate parsing and validation to ResponseParser
    const parsedData = ResponseParser.parse(responseText);

    logger.info("Gemini Provider execution completed successfully", {
      provider: this.id,
      model,
      latencyMs,
      success: true,
    });

    return {
      success: true,
      files: parsedData.files,
      explanation: parsedData.explanation,
      metadata: {
        latencyMs,
        model,
        provider: this.id,
      },
    };
  }
}

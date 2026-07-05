import { GoogleGenAI } from "@google/genai";
import { IAIProvider } from "./ai.provider.js";
import { IAIRequest, IAIResponse } from "../../../types/ai.types.js";
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

    const systemInstruction = `You are a professional React and TypeScript senior frontend engineer.
Generate clean, production-ready React UI component source files based on the user request.

Strict rules:
1. Use React and TypeScript only.
2. Use named exports instead of default exports (e.g., export const MyComponent = ...).
3. Enforce strict TypeScript types. Do NOT use "any". Ensure all components are fully typed.
4. CSS styling: Use either Vanilla CSS or CSS Modules (e.g., .css files). Do NOT use Tailwind CSS.
5. No explanations or markdown outside the files: Return ONLY the structured JSON containing files. Do not write any markdown code blocks, conversational introductions, or summaries outside the JSON schema.
6. Accessible (a11y): Implement modern accessibility standards (proper semantic HTML, ARIA attributes where needed).
7. Clean folder structure: Define paths cleanly (e.g., "/src/components/MyComponent.tsx", "/src/components/MyComponent.css").
8. Production-ready code: Do not include placeholder codes, mock omissions, or "TODO" comments.

Provide the component files in the format of the specified JSON Schema.`;

    const userPrompt = request.prompt;
    const responseSchema = {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: {
            type: "object",
            properties: {
              path: { type: "string" },
              content: { type: "string" },
              type: {
                type: "string",
                enum: ["code", "style", "test", "storybook", "documentation", "config"]
              },
              language: { type: "string" }
            },
            required: ["path", "content", "type", "language"]
          }
        },
        explanation: { type: "string" }
      },
      required: ["files"]
    };

    const apiConfig = {
      systemInstruction,
      temperature,
      maxOutputTokens,
      responseMimeType: "application/json",
      responseSchema,
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

    let parsedData: any;
    try {
      parsedData = JSON.parse(responseText);
    } catch (e: any) {
      logger.error("Failed to parse Gemini response text as JSON", e, { responseText });
      throw new AppError("AI provider response format is not valid JSON", 502);
    }

    if (!parsedData || typeof parsedData !== "object") {
      throw new AppError("AI provider response must be a JSON object", 502);
    }

    if (!Array.isArray(parsedData.files)) {
      throw new AppError("AI provider response missing 'files' array", 502);
    }

    const validatedFiles = parsedData.files.map((file: any, index: number) => {
      if (!file.path || typeof file.path !== "string") {
        throw new AppError(`Invalid file structure at index ${index}: 'path' is required and must be a string`, 502);
      }
      if (typeof file.content !== "string") {
        throw new AppError(`Invalid file structure at index ${index}: 'content' must be a string`, 502);
      }
      if (!file.type || !["code", "style", "test", "storybook", "documentation", "config"].includes(file.type)) {
        throw new AppError(`Invalid file structure at index ${index}: 'type' is invalid`, 502);
      }
      if (!file.language || typeof file.language !== "string") {
        throw new AppError(`Invalid file structure at index ${index}: 'language' must be a string`, 502);
      }
      return {
        path: file.path,
        content: file.content,
        type: file.type,
        language: file.language,
      };
    });

    const explanation = typeof parsedData.explanation === "string" ? parsedData.explanation : undefined;

    logger.info("Gemini Provider execution completed successfully", {
      provider: this.id,
      model,
      latencyMs,
      success: true,
    });

    return {
      success: true,
      files: validatedFiles,
      explanation,
      metadata: {
        latencyMs,
        model,
        provider: this.id,
      },
    };
  }
}

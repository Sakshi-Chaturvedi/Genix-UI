import AppError from "../../../utils/errorHandler.js";
import logger from "../../../utils/logger.js";
import { IGeneratedFile } from "../../../types/ai.types.js";

export class ResponseParser {
  /**
   * Sanitizes, parses, and validates the raw response string from an AI provider.
   */
  public static parse(responseText: string | null | undefined): { files: IGeneratedFile[]; explanation?: string } {
    if (!responseText) {
      throw new AppError("Empty response received from AI provider", 502);
    }

    let sanitized = responseText.trim();

    // 1. Strip markdown code fences if the model wrapped the JSON
    if (sanitized.startsWith("```")) {
      const firstNewlineIndex = sanitized.indexOf("\n");
      if (firstNewlineIndex !== -1) {
        sanitized = sanitized.slice(firstNewlineIndex).trim();
      }
      if (sanitized.endsWith("```")) {
        sanitized = sanitized.slice(0, -3).trim();
      }
    }

    // 2. Isolate the main JSON object if there's any surrounding text/garbage
    const jsonStart = sanitized.indexOf("{");
    const jsonEnd = sanitized.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      sanitized = sanitized.slice(jsonStart, jsonEnd + 1);
    }

    // 3. Attempt JSON parsing
    let parsed: any;
    try {
      parsed = JSON.parse(sanitized);
    } catch (e: any) {
      logger.error("Failed to parse AI provider response as JSON. Raw output below.", e, { rawOutput: responseText });
      throw new AppError("AI provider response format is not valid JSON", 502);
    }

    // 4. Strict Quality & Structure Validation (Step 8)
    if (!parsed || typeof parsed !== "object") {
      throw new AppError("AI provider response must be a JSON object", 502);
    }

    if (!Array.isArray(parsed.files)) {
      throw new AppError("AI provider response is missing a valid 'files' array", 502);
    }

    const validatedFiles = parsed.files.map((file: any, index: number) => {
      if (!file || typeof file !== "object") {
        throw new AppError(`Malformed file structure at index ${index}`, 502);
      }
      if (!file.path || typeof file.path !== "string") {
        throw new AppError(`Invalid file structure at index ${index}: 'path' is required and must be a string`, 502);
      }
      if (typeof file.content !== "string") {
        throw new AppError(`Invalid file structure at index ${index}: 'content' must be a string`, 502);
      }
      if (!file.type || !["code", "style", "test", "storybook", "documentation", "config"].includes(file.type)) {
        throw new AppError(
          `Invalid file type at index ${index}: '${file.type || "undefined"}'. Expected 'code' | 'style' | 'test' | 'storybook' | 'documentation' | 'config'`,
          502
        );
      }
      if (!file.language || typeof file.language !== "string") {
        throw new AppError(`Invalid file structure at index ${index}: 'language' must be a string`, 502);
      }

      return {
        path: file.path,
        content: file.content,
        type: file.type as "code" | "style" | "test" | "storybook" | "documentation" | "config",
        language: file.language,
      };
    });

    const explanation = typeof parsed.explanation === "string" ? parsed.explanation : undefined;

    return {
      files: validatedFiles,
      explanation,
    };
  }
}

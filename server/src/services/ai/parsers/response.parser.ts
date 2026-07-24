import { JSONExtractor } from "../../../utils/ai/json.extractor.js";
import { ResponseNormalizer } from "../../../utils/ai/response.normalizer.js";
import { validateAIResponse, AIResponsePayload } from "../../../utils/ai/ai.response.schema.js";
import { IGeneratedFile } from "../../../types/ai.types.js";
import logger from "../../../utils/logger.js";
import { performance } from "perf_hooks";

export interface IParsedResponse {
  files: IGeneratedFile[];
  explanation?: string;
  normalized: AIResponsePayload;
}

export class ResponseParser {
  /**
   * Sanitizes, parses, normalizes, and validates the raw response string from an AI provider.
   *
   * @param responseText - Raw string from the AI provider
   * @param provider - Provider name (defaults to "unknown")
   * @param model - Model name (defaults to "unknown")
   * @returns Typed response object containing files, explanation, and the full normalized schema
   */
  public static parse(
    responseText: string | null | undefined,
    provider = "unknown",
    model = "unknown",
    startTime?: number
  ): IParsedResponse {
    const responseSize = responseText ? responseText.length : 0;
    const baseTime = startTime ?? performance.now();

    // 1. JSON Extraction (Step 1)
    const extractStart = performance.now();
    const rawJson = JSONExtractor.extract(responseText as string);
    const parsingTime = Math.round(performance.now() - extractStart);
    logger.info(`[8] JSON parsed - ${Math.round(performance.now() - baseTime)}ms`);

    // 2. Normalization (Step 2)
    const normalizedJson = ResponseNormalizer.normalize(rawJson, provider, model);

    // 3. Zod Validation (Step 3)
    const validationStart = performance.now();
    const validated = validateAIResponse(normalizedJson);
    const validationTime = Math.round(performance.now() - validationStart);
    logger.info(`[9] Schema validated - ${Math.round(performance.now() - baseTime)}ms`);

    // 4. Logging (Step 7)
    logger.info("AI response parsing and validation completed", {
      provider,
      model,
      responseSize,
      parsingTimeMs: parsingTime,
      validationTimeMs: validationTime,
    });

    // 5. Return Typed Object (Step 6 / Backward compatibility)
    return {
      files: validated.data.files as IGeneratedFile[],
      explanation: validated.data.explanation,
      normalized: validated,
    };
  }
}

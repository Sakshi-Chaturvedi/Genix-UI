import { z } from "zod";
import { SchemaValidationError } from "./ai.errors.js";

/**
 * Zod schema for a single file in the files array.
 */
export const AIFileSchema = z.object({
  path: z.string().min(1, "File path must not be empty"),
  content: z.string(),
  language: z.string().min(1, "File language must not be empty"),
  type: z.enum(
    ["code", "style", "test", "storybook", "documentation", "config"],
    {
      errorMap: () => ({
        message:
          "Invalid file type. Expected 'code' | 'style' | 'test' | 'storybook' | 'documentation' | 'config'",
      }),
    }
  ),
});

/**
 * Zod schema for metadata.
 */
export const AIMetadataSchema = z.object({
  provider: z.string().min(1, "Provider must not be empty"),
  model: z.string().min(1, "Model must not be empty"),
}).catchall(z.any());

/**
 * Zod schema for data container.
 */
export const AIDataSchema = z.object({
  provider: z.string().min(1, "Provider must not be empty"),
  model: z.string().min(1, "Model must not be empty"),
  files: z
    .array(AIFileSchema, {
      invalid_type_error: "AI provider response is missing a valid 'files' array",
      required_error: "AI provider response is missing a valid 'files' array",
    })
    .min(1, "AI provider response is missing a valid 'files' array"),
  metadata: AIMetadataSchema,
  explanation: z.string().optional(),
});

/**
 * The strict Zod schema for the final normalized response.
 */
export const AIResponseSchema = z.object({
  success: z.boolean(),
  data: AIDataSchema,
});

export type AIFile = z.infer<typeof AIFileSchema>;
export type AIMetadata = z.infer<typeof AIMetadataSchema>;
export type AIData = z.infer<typeof AIDataSchema>;
export type AIResponsePayload = z.infer<typeof AIResponseSchema>;

/**
 * Validates a parsed, normalized object against the AIResponseSchema.
 *
 * @param raw - Parsed and normalized object
 * @returns Typed and validated AIResponsePayload
 * @throws SchemaValidationError with detailed field-level errors on failure
 */
export function validateAIResponse(raw: Record<string, any>): AIResponsePayload {
  const result = AIResponseSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.errors.map(
      (e) => `[${e.path.join(".")}] ${e.message}`
    );
    throw new SchemaValidationError(
      errors,
      `AI response schema validation failed: ${errors.join("; ")}`
    );
  }

  return result.data;
}

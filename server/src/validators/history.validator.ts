import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const createHistorySchema = z.object({
  body: z.object(
    {
      prompt: z
        .string({
          required_error: "Prompt is required",
        })
        .trim()
        .min(5, "Prompt must be at least 5 characters long")
        .max(5000, "Prompt must not exceed 5000 characters"),
      feature: z.enum(
        [
          "generate-component",
          "improve-component",
          "convert-js-ts",
          "explain-component",
          "generate-page",
          "fix-component",
        ],
        {
          required_error: "Feature is required",
          invalid_type_error: "Invalid feature type",
        }
      ),
      status: z.enum(["pending", "success", "failed"], {
        required_error: "Status is required",
        invalid_type_error: "Invalid status type",
      }),
      model: z.string().trim().optional(),
      response: z.any().optional(),
      projectId: objectIdSchema.optional(),
      componentId: objectIdSchema.optional(),
      generatedFiles: z.array(z.string().trim()).optional(),
      tokens: z.number().int().nonnegative().optional(),
      executionTime: z.number().int().nonnegative().optional(),
    },
    {
      required_error: "Request body is required",
    }
  ),
});

export const getHistoryByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const deleteHistorySchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

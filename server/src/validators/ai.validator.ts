import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

const generationOptionsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  timeout: z.number().int().positive().optional(),
  retries: z.number().int().nonnegative().optional(),
});

export const generateComponentSchema = z.object({
  body: z.object({
    prompt: z
      .string({
        required_error: "Prompt is required",
      })
      .trim()
      .min(5, "Prompt must be at least 5 characters long")
      .max(5000, "Prompt must not exceed 5000 characters"),
    projectId: objectIdSchema.optional(),
    options: generationOptionsSchema.optional(),
  }),
});

export const convertComponentSchema = z.object({
  body: z.object({
    code: z
      .string({
        required_error: "Code to convert is required",
      })
      .min(1, "Code cannot be empty"),
    sourceLanguage: z.enum(["javascript", "js", "jsx"], {
      required_error: "Source language is required",
    }),
    targetLanguage: z.enum(["typescript", "ts", "tsx"], {
      required_error: "Target language is required",
    }),
    projectId: objectIdSchema.optional(),
    options: generationOptionsSchema.optional(),
  }),
});

export const improveComponentSchema = z.object({
  body: z.object({
    code: z
      .string({
        required_error: "Base code is required",
      })
      .min(1, "Code cannot be empty"),
    prompt: z
      .string({
        required_error: "Improvement instructions are required",
      })
      .trim()
      .min(5, "Instructions must be at least 5 characters long")
      .max(5000, "Instructions must not exceed 5000 characters"),
    projectId: objectIdSchema.optional(),
    options: generationOptionsSchema.optional(),
  }),
});

export const explainComponentSchema = z.object({
  body: z.object({
    code: z
      .string({
        required_error: "Code to explain is required",
      })
      .min(1, "Code cannot be empty"),
    projectId: objectIdSchema.optional(),
    options: generationOptionsSchema.optional(),
  }),
});

export const generatePageSchema = z.object({
  body: z.object({
    prompt: z
      .string({
        required_error: "Prompt is required",
      })
      .trim()
      .min(5, "Prompt must be at least 5 characters long")
      .max(5000, "Prompt must not exceed 5000 characters"),
    projectId: objectIdSchema.optional(),
    options: generationOptionsSchema.optional(),
  }),
});

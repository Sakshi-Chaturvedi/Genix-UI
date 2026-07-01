import { z } from "zod";

// Regular expression to match a 24-character hex MongoDB ObjectId
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid Project ID format");

export const createComponentSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: "Name is required",
      })
      .trim()
      .min(2, "Name must be at least 2 characters long")
      .max(80, "Name must not exceed 80 characters"),
    componentType: z
      .string({
        required_error: "Component type is required",
      })
      .trim(),
    prompt: z
      .string()
      .trim()
      .max(1000, "Prompt must not exceed 1000 characters")
      .optional(),
    tsxCode: z
      .string({
        required_error: "TSX code is required",
      })
      .min(1, "TSX code cannot be empty"),
    cssCode: z.string().optional(),
    usageExample: z.string().optional(),
    projectId: objectIdSchema.optional(),
    isSaved: z.boolean().optional(),
    tags: z.array(z.string().trim()).optional(),
  }),
});

export const updateComponentSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(80, "Name must not exceed 80 characters")
        .optional(),
      componentType: z.string().trim().optional(),
      prompt: z
        .string()
        .trim()
        .max(1000, "Prompt must not exceed 1000 characters")
        .optional(),
      tsxCode: z.string().min(1, "TSX code cannot be empty").optional(),
      cssCode: z.string().optional(),
      usageExample: z.string().optional(),
      projectId: objectIdSchema.optional(),
      isSaved: z.boolean().optional(),
      tags: z.array(z.string().trim()).optional(),
    })
    .refine(
      (data) =>
        data.name !== undefined ||
        data.componentType !== undefined ||
        data.prompt !== undefined ||
        data.tsxCode !== undefined ||
        data.cssCode !== undefined ||
        data.usageExample !== undefined ||
        data.projectId !== undefined ||
        data.isSaved !== undefined ||
        data.tags !== undefined,
      {
        message: "At least one field must be provided for update",
        path: ["name"], // default field to attach error to
      }
    ),
});

import { z } from "zod";

export const createProjectSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: "Name is required",
      })
      .trim()
      .min(2, "Name must be at least 2 characters long")
      .max(80, "Name must not exceed 80 characters"),
    description: z
      .string()
      .trim()
      .max(300, "Description must not exceed 300 characters")
      .optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(80, "Name must not exceed 80 characters")
        .optional(),
      description: z
        .string()
        .trim()
        .max(300, "Description must not exceed 300 characters")
        .optional(),
    })
    .refine(
      (data) => data.name !== undefined || data.description !== undefined,
      {
        message: "At least one field (name or description) must be provided",
        path: ["name"], // Attach error to name field by default if none provided
      }
    ),
});

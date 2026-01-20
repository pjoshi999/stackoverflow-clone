import { z } from "zod";

/**
 * Validation schema for creating a comment
 */
export const createCommentSchema = z.object({
  commentable_type: z.enum(["question", "answer"]),
  commentable_id: z.number().int().positive(),
  body: z
    .string()
    .min(5, "Comment must be at least 5 characters")
    .max(600, "Comment must not exceed 600 characters"),
});

/**
 * Validation schema for entity type and ID parameters
 */
export const entityParamsSchema = z.object({
  entityType: z.enum(["question", "answer"]),
  entityId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
});

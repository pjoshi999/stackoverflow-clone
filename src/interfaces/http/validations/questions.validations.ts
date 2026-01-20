import { z } from "zod";

/**
 * Validation schema for creating a question
 */
export const createQuestionSchema = z.object({
  title: z
    .string()
    .min(15, "Title must be at least 15 characters")
    .max(150, "Title must not exceed 150 characters"),
  body: z
    .string()
    .min(30, "Question body must be at least 30 characters")
    .max(30000, "Question body must not exceed 30000 characters"),
  tags: z
    .array(z.string().min(1).max(35))
    .min(1, "At least one tag is required")
    .max(5, "Maximum 5 tags allowed")
    .refine(
      (tags) => tags.every((tag) => /^[a-z0-9-]+$/.test(tag)),
      "Tags must contain only lowercase letters, numbers, and hyphens",
    ),
});

/**
 * Validation schema for listing/searching questions
 */
export const listQuestionsSchema = z.object({
  q: z.string().optional(),
  tags: z.string().optional(),
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => Math.min(parseInt(val, 10), 100)),
});

/**
 * Validation schema for voting
 */
export const voteSchema = z.object({
  vote_type: z.enum(["upvote", "downvote"]),
});

/**
 * Validation schema for question ID parameter
 */
export const questionIdSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
});

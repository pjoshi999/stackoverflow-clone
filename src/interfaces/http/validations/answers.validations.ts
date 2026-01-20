import { z } from "zod";

/**
 * Validation schema for creating an answer
 */
export const createAnswerSchema = z.object({
  question_id: z.number().int().positive(),
  body: z
    .string()
    .min(30, "Answer must be at least 30 characters")
    .max(30000, "Answer must not exceed 30000 characters"),
});

/**
 * Validation schema for voting on an answer
 */
export const voteSchema = z.object({
  vote_type: z.enum(["upvote", "downvote"]),
});

/**
 * Validation schema for answer ID parameter
 */
export const answerIdSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
});

/**
 * Validation schema for question ID parameter (when creating answer)
 */
export const questionIdSchema = z.object({
  questionId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
});

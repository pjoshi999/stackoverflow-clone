import pool from "../../../infrastructure/db/db";
import { cacheInvalidatePattern } from "../../../infrastructure/cache";
import {
  Comment,
  CommentableType,
  CreateCommentDTO,
} from "../domain/comment.interface";

export const createComment = async (
  dto: CreateCommentDTO,
): Promise<Comment> => {
  const result = await pool.query<Comment>(
    "INSERT INTO comments (user_id, commentable_type, commentable_id, body) VALUES ($1, $2, $3, $4) RETURNING *",
    [dto.user_id, dto.commentable_type, dto.commentable_id, dto.body],
  );

  if (dto.commentable_type === "question") {
    await cacheInvalidatePattern(`questions:*`);
  } else if (dto.commentable_type === "answer") {
    const answerResult = await pool.query(
      "SELECT question_id FROM answers WHERE id = $1",
      [dto.commentable_id],
    );
    if (answerResult.rows.length > 0) {
      await cacheInvalidatePattern(`questions:*`);
    }
  }

  return result.rows[0];
};

export const findCommentsByCommentable = async (
  commentableType: CommentableType,
  commentableId: number,
): Promise<Comment[]> => {
  const result = await pool.query<Comment>(
    "SELECT * FROM comments WHERE commentable_type = $1 AND commentable_id = $2 ORDER BY created_at ASC",
    [commentableType, commentableId],
  );
  return result.rows;
};

export const findCommentById = async (id: number): Promise<Comment | null> => {
  const result = await pool.query<Comment>(
    "SELECT * FROM comments WHERE id = $1",
    [id],
  );
  return result.rows[0] || null;
};

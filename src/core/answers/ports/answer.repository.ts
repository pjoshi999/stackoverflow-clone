import pool from "../../../infrastructure/db/db";
import { cacheInvalidatePattern } from "../../../infrastructure/cache";
import { Answer, CreateAnswerDTO } from "../domain/answer.interface";

export const createAnswer = async (dto: CreateAnswerDTO): Promise<Answer> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<Answer>(
      "INSERT INTO answers (question_id, user_id, body) VALUES ($1, $2, $3) RETURNING *",
      [dto.question_id, dto.user_id, dto.body],
    );

    await client.query(
      "UPDATE questions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [dto.question_id],
    );

    await client.query("COMMIT");

    await cacheInvalidatePattern(`questions:*`);

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const findAnswerById = async (id: number): Promise<Answer | null> => {
  const result = await pool.query<Answer>(
    "SELECT * FROM answers WHERE id = $1",
    [id],
  );
  return result.rows[0] || null;
};

export const findAnswersByQuestionId = async (
  questionId: number,
): Promise<Answer[]> => {
  const result = await pool.query<Answer>(
    "SELECT * FROM answers WHERE question_id = $1 ORDER BY is_accepted DESC, created_at ASC",
    [questionId],
  );
  return result.rows;
};

import pool from "../../../infrastructure/db/db";
import { UserProfile } from "../domain/user-profile.interface";

export const getUserProfile = async (
  userId: number,
): Promise<UserProfile | null> => {
  const userQuery = `
    SELECT 
      u.id, u.username, u.email, u.reputation, u.created_at,
      COUNT(DISTINCT q.id) as question_count,
      COUNT(DISTINCT a.id) as answer_count
    FROM users u
    LEFT JOIN questions q ON u.id = q.user_id
    LEFT JOIN answers a ON u.id = a.user_id
    WHERE u.id = $1
    GROUP BY u.id, u.username, u.email, u.reputation, u.created_at
  `;

  const questionsQuery = `
    SELECT 
      q.id, q.title, q.created_at,
      COALESCE(SUM(CASE WHEN v.vote_type = 'upvote' THEN 1 WHEN v.vote_type = 'downvote' THEN -1 ELSE 0 END), 0) as vote_count,
      COUNT(DISTINCT a.id) as answer_count
    FROM questions q
    LEFT JOIN votes v ON q.id = v.votable_id AND v.votable_type = 'question'
    LEFT JOIN answers a ON q.id = a.question_id
    WHERE q.user_id = $1
    GROUP BY q.id, q.title, q.created_at
    ORDER BY q.created_at DESC
    LIMIT 10
  `;

  const answersQuery = `
    SELECT 
      a.id, a.body, a.is_accepted, a.created_at,
      q.id as question_id, q.title as question_title,
      COALESCE(SUM(CASE WHEN v.vote_type = 'upvote' THEN 1 WHEN v.vote_type = 'downvote' THEN -1 ELSE 0 END), 0) as vote_count
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    LEFT JOIN votes v ON a.id = v.votable_id AND v.votable_type = 'answer'
    WHERE a.user_id = $1
    GROUP BY a.id, a.body, a.is_accepted, a.created_at, q.id, q.title
    ORDER BY a.created_at DESC
    LIMIT 10
  `;

  const [userResult, questionsResult, answersResult] = await Promise.all([
    pool.query(userQuery, [userId]),
    pool.query(questionsQuery, [userId]),
    pool.query(answersQuery, [userId]),
  ]);

  if (userResult.rows.length === 0) return null;

  return {
    ...userResult.rows[0],
    recent_questions: questionsResult.rows,
    recent_answers: answersResult.rows,
  };
};

export const getTopUsers = async (limit: number): Promise<UserProfile[]> => {
  const query = `
    SELECT 
      u.id, u.username, u.reputation, u.created_at, u.email,
      COUNT(DISTINCT q.id) as question_count,
      COUNT(DISTINCT a.id) as answer_count
    FROM users u
    LEFT JOIN questions q ON u.id = q.user_id
    LEFT JOIN answers a ON u.id = a.user_id
    GROUP BY u.id, u.username, u.reputation, u.created_at, u.email
    ORDER BY u.reputation DESC
    LIMIT $1
  `;

  const result = await pool.query(query, [limit]);
  return result.rows;
};

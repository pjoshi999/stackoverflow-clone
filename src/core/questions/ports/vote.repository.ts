import pool from "../../../infrastructure/db/db";
import { cacheInvalidatePattern } from "../../../infrastructure/cache";
import { Vote, VoteType, VotableType } from "../domain/question.interface";

export const findVoteByUserAndVotable = async (
  userId: number,
  votableType: VotableType,
  votableId: number,
): Promise<Vote | null> => {
  const result = await pool.query<Vote>(
    "SELECT * FROM votes WHERE user_id = $1 AND votable_type = $2 AND votable_id = $3",
    [userId, votableType, votableId],
  );
  return result.rows[0] || null;
};

export const createVote = async (
  userId: number,
  votableType: VotableType,
  votableId: number,
  voteType: VoteType,
  authorId: number,
): Promise<Vote> => {
  const result = await pool.query<Vote>(
    "INSERT INTO votes (user_id, votable_type, votable_id, vote_type, author_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [userId, votableType, votableId, voteType, authorId],
  );
  await cacheInvalidatePattern("questions:*");
  return result.rows[0];
};

export const updateVote = async (
  voteId: number,
  voteType: VoteType,
): Promise<void> => {
  await pool.query("UPDATE votes SET vote_type = $1 WHERE id = $2", [
    voteType,
    voteId,
  ]);
  await cacheInvalidatePattern("questions:*");
};

export const deleteVote = async (voteId: number): Promise<void> => {
  await pool.query("DELETE FROM votes WHERE id = $1", [voteId]);
  await cacheInvalidatePattern("questions:*");
};

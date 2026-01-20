import pool from "../../../infrastructure/db/db";

export interface Session {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  revoked: boolean;
}

export const createSession = async (
  userId: number,
  token: string,
  expiresAt: Date,
): Promise<Session> => {
  const result = await pool.query<Session>(
    "INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *",
    [userId, token, expiresAt],
  );
  return result.rows[0];
};

export const findSession = async (token: string): Promise<Session | null> => {
  const result = await pool.query<Session>(
    "SELECT * FROM sessions WHERE token = $1",
    [token],
  );
  return result.rows[0] || null;
};

export const revokeSession = async (token: string): Promise<void> => {
  await pool.query("UPDATE sessions SET revoked = TRUE WHERE token = $1", [
    token,
  ]);
};

export const revokeAllUserSessions = async (userId: number): Promise<void> => {
  await pool.query("UPDATE sessions SET revoked = TRUE WHERE user_id = $1", [
    userId,
  ]);
};

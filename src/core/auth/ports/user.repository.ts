import pool from "../../../infrastructure/db/db";
import { User, CreateUserDTO } from "../domain/user.interface";

export const createUser = async (
  dto: CreateUserDTO,
  passwordHash: string,
): Promise<User> => {
  const result = await pool.query<User>(
    "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, password_hash, reputation, created_at",
    [dto.username, dto.email, passwordHash],
  );
  return result.rows[0];
};

export const findUserById = async (id: number): Promise<User | null> => {
  const result = await pool.query<User>(
    "SELECT id, username, email, password_hash, reputation, created_at FROM users WHERE id = $1",
    [id],
  );
  return result.rows[0] || null;
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query<User>(
    "SELECT id, username, email, password_hash, reputation, created_at FROM users WHERE email = $1",
    [email],
  );
  return result.rows[0] || null;
};

export const findUserByUsername = async (
  username: string,
): Promise<User | null> => {
  const result = await pool.query<User>(
    "SELECT id, username, email, password_hash, reputation, created_at FROM users WHERE username = $1",
    [username],
  );
  return result.rows[0] || null;
};

export const updateUserReputation = async (
  userId: number,
  reputationDelta: number,
): Promise<void> => {
  await pool.query(
    "UPDATE users SET reputation = reputation + $1 WHERE id = $2",
    [reputationDelta, userId],
  );
};

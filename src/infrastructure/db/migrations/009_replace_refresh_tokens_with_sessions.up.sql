-- Migration: 009_replace_refresh_tokens_with_sessions
-- Description: Replace refresh_tokens table with sessions table
-- Created: 2026-01-20

-- Drop the old table
DROP TABLE IF EXISTS refresh_tokens;

-- Create the new sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(512) NOT NULL, -- The refresh token string
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

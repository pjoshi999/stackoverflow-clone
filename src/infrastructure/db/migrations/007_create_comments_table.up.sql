-- Migration: 007_create_comments_table
-- Description: Create comments table for questions and answers
-- Created: 2026-01-20

DO $$ BEGIN
  CREATE TYPE commentable_type_enum AS ENUM ('question', 'answer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commentable_type commentable_type_enum NOT NULL,
  commentable_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_commentable ON comments(commentable_type, commentable_id);
CREATE INDEX idx_comments_created_at ON comments(created_at ASC);

-- Migration: 003_create_questions_table
-- Description: Create questions table with full-text search
-- Created: 2026-01-20

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  search_vector tsvector,
  CONSTRAINT positive_views CHECK (views >= 0)
);

CREATE INDEX idx_questions_user_id ON questions(user_id);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX idx_questions_search_vector ON questions USING GIN(search_vector);

-- Trigger to automatically update search_vector
CREATE OR REPLACE FUNCTION update_question_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.body, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_search_vector
BEFORE INSERT OR UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_question_search_vector();

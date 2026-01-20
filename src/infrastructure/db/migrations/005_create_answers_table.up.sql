-- Migration: 005_create_answers_table
-- Description: Create answers table for question responses
-- Created: 2026-01-20

CREATE TABLE IF NOT EXISTS answers (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_user_id ON answers(user_id);
CREATE INDEX idx_answers_created_at ON answers(created_at DESC);
CREATE INDEX idx_answers_is_accepted ON answers(is_accepted);

-- Trigger to update question's updated_at
CREATE OR REPLACE FUNCTION update_question_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE questions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.question_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_timestamp
AFTER INSERT OR UPDATE ON answers
FOR EACH ROW
EXECUTE FUNCTION update_question_timestamp();

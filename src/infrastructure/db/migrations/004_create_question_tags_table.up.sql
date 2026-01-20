-- Migration: 004_create_question_tags_table
-- Description: Many-to-many relationship between questions and tags
-- Created: 2026-01-20

CREATE TABLE IF NOT EXISTS question_tags (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(question_id, tag_id)
);

CREATE INDEX idx_question_tags_question_id ON question_tags(question_id);
CREATE INDEX idx_question_tags_tag_id ON question_tags(tag_id);

-- Trigger to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tag_usage_count
AFTER INSERT OR DELETE ON question_tags
FOR EACH ROW
EXECUTE FUNCTION update_tag_usage_count();

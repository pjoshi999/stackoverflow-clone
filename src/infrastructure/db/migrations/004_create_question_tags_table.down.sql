-- Rollback: 004_create_question_tags_table

DROP TRIGGER IF EXISTS trigger_update_tag_usage_count ON question_tags;
DROP FUNCTION IF EXISTS update_tag_usage_count();
DROP INDEX IF EXISTS idx_question_tags_tag_id;
DROP INDEX IF EXISTS idx_question_tags_question_id;
DROP TABLE IF EXISTS question_tags CASCADE;

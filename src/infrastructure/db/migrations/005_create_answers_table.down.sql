-- Rollback: 005_create_answers_table

DROP TRIGGER IF EXISTS trigger_update_question_timestamp ON answers;
DROP FUNCTION IF EXISTS update_question_timestamp();
DROP INDEX IF EXISTS idx_answers_is_accepted;
DROP INDEX IF EXISTS idx_answers_created_at;
DROP INDEX IF EXISTS idx_answers_user_id;
DROP INDEX IF EXISTS idx_answers_question_id;
DROP TABLE IF EXISTS answers CASCADE;

-- Rollback: 003_create_questions_table

DROP TRIGGER IF EXISTS trigger_update_question_search_vector ON questions;
DROP FUNCTION IF EXISTS update_question_search_vector();
DROP INDEX IF EXISTS idx_questions_search_vector;
DROP INDEX IF EXISTS idx_questions_created_at;
DROP INDEX IF EXISTS idx_questions_user_id;
DROP TABLE IF EXISTS questions CASCADE;

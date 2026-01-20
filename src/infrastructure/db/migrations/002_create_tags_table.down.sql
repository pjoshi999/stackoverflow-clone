-- Rollback: 002_create_tags_table

DROP INDEX IF EXISTS idx_tags_usage_count;
DROP INDEX IF EXISTS idx_tags_name;
DROP TABLE IF EXISTS tags CASCADE;

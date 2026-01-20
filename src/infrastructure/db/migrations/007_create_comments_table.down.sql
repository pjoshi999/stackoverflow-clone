-- Rollback: 007_create_comments_table

DROP INDEX IF EXISTS idx_comments_created_at;
DROP INDEX IF EXISTS idx_comments_commentable;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP TABLE IF EXISTS comments CASCADE;
DROP TYPE IF EXISTS commentable_type_enum;

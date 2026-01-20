-- Rollback: 001_create_users_table

DROP INDEX IF EXISTS idx_users_reputation;
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_email;
DROP TABLE IF EXISTS users CASCADE;

-- Migration: 000_create_migrations_table
-- Description: Create migrations tracking table
-- Created: 2026-01-20

CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

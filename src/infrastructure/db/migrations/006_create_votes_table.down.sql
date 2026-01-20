-- Rollback: 006_create_votes_table

DROP TRIGGER IF EXISTS trigger_update_reputation_on_vote ON votes;
DROP FUNCTION IF EXISTS update_reputation_on_vote();
DROP INDEX IF EXISTS idx_votes_votable;
DROP INDEX IF EXISTS idx_votes_user_id;
DROP TABLE IF EXISTS votes CASCADE;
DROP TYPE IF EXISTS votable_type_enum;
DROP TYPE IF EXISTS vote_type_enum;

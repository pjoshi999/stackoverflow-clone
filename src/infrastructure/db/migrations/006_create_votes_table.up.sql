-- Migration: 006_create_votes_table
-- Description: Create votes table with enums and reputation triggers
-- Created: 2026-01-20

DO $$ BEGIN
  CREATE TYPE vote_type_enum AS ENUM ('upvote', 'downvote');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE votable_type_enum AS ENUM ('question', 'answer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  votable_type votable_type_enum NOT NULL,
  votable_id INTEGER NOT NULL,
  vote_type vote_type_enum NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, votable_type, votable_id)
);

CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_votable ON votes(votable_type, votable_id);

-- Trigger to update user reputation on votes
CREATE OR REPLACE FUNCTION update_reputation_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id INTEGER;
  reputation_change INTEGER;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.votable_type = 'question' THEN
      SELECT user_id INTO target_user_id FROM questions WHERE id = NEW.votable_id;
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 5 ELSE -1 END;
    ELSE
      SELECT user_id INTO target_user_id FROM answers WHERE id = NEW.votable_id;
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 10 ELSE -2 END;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
      reputation_change := reputation_change * 2;
    END IF;
    
    UPDATE users SET reputation = GREATEST(reputation + reputation_change, 0) WHERE id = target_user_id;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.votable_type = 'question' THEN
      SELECT user_id INTO target_user_id FROM questions WHERE id = OLD.votable_id;
      reputation_change := CASE WHEN OLD.vote_type = 'upvote' THEN -5 ELSE 1 END;
    ELSE
      SELECT user_id INTO target_user_id FROM answers WHERE id = OLD.votable_id;
      reputation_change := CASE WHEN OLD.vote_type = 'upvote' THEN -10 ELSE 2 END;
    END IF;
    
    UPDATE users SET reputation = GREATEST(reputation + reputation_change, 0) WHERE id = target_user_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reputation_on_vote
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_reputation_on_vote();

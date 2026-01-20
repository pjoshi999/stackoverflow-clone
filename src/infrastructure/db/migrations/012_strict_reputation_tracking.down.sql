-- Migration: 012_strict_reputation_tracking
-- Description: Revert strict tracking

-- 1. Restore the previous trigger function (from migration 011)
-- Logic: Still uses author_id, but uses Standard Values doubling (the buggy "bounce" logic was technically "Standard logic" in simple terms, but strictly wrong).
-- Actually, let's restore the "Corrected Standard" logic from 011/010.

CREATE OR REPLACE FUNCTION update_reputation_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  reputation_change INTEGER;
  old_reputation_change INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.votable_type = 'question' THEN
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 5 ELSE -1 END;
    ELSE
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 10 ELSE -2 END;
    END IF;
    
    UPDATE users SET reputation = GREATEST(reputation + reputation_change, 0) WHERE id = NEW.author_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.votable_type = 'question' THEN
      old_reputation_change := CASE WHEN OLD.vote_type = 'upvote' THEN -5 ELSE 1 END;
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 5 ELSE -1 END;
    ELSE
      old_reputation_change := CASE WHEN OLD.vote_type = 'upvote' THEN -10 ELSE 2 END;
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 10 ELSE -2 END;
    END IF;
    
    UPDATE users SET reputation = GREATEST(reputation + old_reputation_change + reputation_change, 0) WHERE id = NEW.author_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.votable_type = 'question' THEN
      reputation_change := CASE WHEN OLD.vote_type = 'upvote' THEN -5 ELSE 1 END;
    ELSE
      reputation_change := CASE WHEN OLD.vote_type = 'upvote' THEN -10 ELSE 2 END;
    END IF;
    
    UPDATE users SET reputation = GREATEST(reputation + reputation_change, 0) WHERE id = OLD.author_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop the trigger and recreate it as AFTER trigger (Old style)
-- The new one was BEFORE trigger (to set NEW.reputation_delta). Old one was AFTER.
DROP TRIGGER IF EXISTS trigger_update_reputation_on_vote ON votes;

CREATE TRIGGER trigger_update_reputation_on_vote
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_reputation_on_vote();

-- 3. Drop the column
ALTER TABLE votes DROP COLUMN reputation_delta;

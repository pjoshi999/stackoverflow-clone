-- Migration: 010_fix_vote_reputation_update
-- Description: Fix reputation calculation on vote updates
-- Created: 2026-01-21

-- Drop and recreate the trigger function with correct logic
CREATE OR REPLACE FUNCTION update_reputation_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id INTEGER;
  reputation_change INTEGER;
  old_reputation_change INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- New vote: apply reputation change
    IF NEW.votable_type = 'question' THEN
      SELECT user_id INTO target_user_id FROM questions WHERE id = NEW.votable_id;
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 5 ELSE -1 END;
    ELSE
      SELECT user_id INTO target_user_id FROM answers WHERE id = NEW.votable_id;
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 10 ELSE -2 END;
    END IF;
    
    UPDATE users SET reputation = GREATEST(reputation + reputation_change, 0) WHERE id = target_user_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Vote changed: reverse old vote and apply new vote
    IF NEW.votable_type = 'question' THEN
      SELECT user_id INTO target_user_id FROM questions WHERE id = NEW.votable_id;
      -- Reverse old vote
      old_reputation_change := CASE WHEN OLD.vote_type = 'upvote' THEN -5 ELSE 1 END;
      -- Apply new vote
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 5 ELSE -1 END;
    ELSE
      SELECT user_id INTO target_user_id FROM answers WHERE id = NEW.votable_id;
      -- Reverse old vote
      old_reputation_change := CASE WHEN OLD.vote_type = 'upvote' THEN -10 ELSE 2 END;
      -- Apply new vote
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 10 ELSE -2 END;
    END IF;
    
    UPDATE users SET reputation = GREATEST(reputation + old_reputation_change + reputation_change, 0) WHERE id = target_user_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Vote removed: reverse the vote
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

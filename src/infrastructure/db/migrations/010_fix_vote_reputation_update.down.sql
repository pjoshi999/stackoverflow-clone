-- Migration: 010_fix_vote_reputation_update
-- Description: Revert to original (buggy) trigger

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

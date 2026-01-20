-- Migration: 014_debug_reputation_trigger
-- Description: Add logging to debug reputation trigger

CREATE OR REPLACE FUNCTION update_reputation_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  target_change INTEGER;
  actual_change INTEGER;
  current_rep INTEGER;
  intermediate_rep INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT reputation INTO current_rep FROM users WHERE id = NEW.author_id;
    
    RAISE NOTICE 'INSERT Trigger: Author %, CurrentRep %', NEW.author_id, current_rep;
    
    IF NEW.votable_type = 'question' THEN
      target_change := CASE WHEN NEW.vote_type = 'upvote' THEN 5 ELSE -1 END;
    ELSE
      target_change := CASE WHEN NEW.vote_type = 'upvote' THEN 10 ELSE -2 END;
    END IF;
    
    RAISE NOTICE 'TargetChange %', target_change;
    
    IF target_change < 0 THEN
      actual_change := GREATEST(target_change, -current_rep);
    ELSE
      actual_change := target_change;
    END IF;
    
    RAISE NOTICE 'ActualChange %', actual_change;
    
    NEW.reputation_delta := actual_change;
    
    UPDATE users SET reputation = GREATEST(reputation + actual_change, 0) WHERE id = NEW.author_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE users SET reputation = GREATEST(reputation - OLD.reputation_delta, 0) WHERE id = OLD.author_id;
    
    SELECT reputation INTO intermediate_rep FROM users WHERE id = NEW.author_id;
    
    IF NEW.votable_type = 'question' THEN
      target_change := CASE WHEN NEW.vote_type = 'upvote' THEN 5 ELSE -1 END;
    ELSE
      target_change := CASE WHEN NEW.vote_type = 'upvote' THEN 10 ELSE -2 END;
    END IF;
    
    IF target_change < 0 THEN
      actual_change := GREATEST(target_change, -intermediate_rep);
    ELSE
      actual_change := target_change;
    END IF;
    
    NEW.reputation_delta := actual_change;
    
    UPDATE users SET reputation = GREATEST(reputation + actual_change, 0) WHERE id = NEW.author_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET reputation = GREATEST(reputation - OLD.reputation_delta, 0) WHERE id = OLD.author_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

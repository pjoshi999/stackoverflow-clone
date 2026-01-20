-- Migration: 013_fix_positive_reputation_crash
-- Description: Revert GREATEST(0) safety (Back to 012 strict logic)

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
    
    IF NEW.votable_type = 'question' THEN
      target_change := CASE WHEN NEW.vote_type = 'upvote' THEN 5 ELSE -1 END;
    ELSE
      target_change := CASE WHEN NEW.vote_type = 'upvote' THEN 10 ELSE -2 END;
    END IF;
    
    IF target_change < 0 THEN
      actual_change := GREATEST(target_change, -current_rep);
    ELSE
      actual_change := target_change;
    END IF;
    
    NEW.reputation_delta := actual_change;
    
    UPDATE users SET reputation = reputation + actual_change WHERE id = NEW.author_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Dangerous Revert: Remove GREATEST safe-guard
    UPDATE users SET reputation = reputation - OLD.reputation_delta WHERE id = OLD.author_id;
    
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
    
    UPDATE users SET reputation = reputation + actual_change WHERE id = NEW.author_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Dangerous Revert: Remove GREATEST safe-guard
    UPDATE users SET reputation = reputation - OLD.reputation_delta WHERE id = OLD.author_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

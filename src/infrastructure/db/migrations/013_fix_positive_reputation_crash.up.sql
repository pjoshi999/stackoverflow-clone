-- Migration: 013_fix_positive_reputation_crash
-- Description: Apply GREATEST(0) to reputation updates to prevent negative debt crashes
-- Created: 2026-01-21

CREATE OR REPLACE FUNCTION update_reputation_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  target_change INTEGER;
  actual_change INTEGER;
  current_rep INTEGER;
  intermediate_rep INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get current reputation
    SELECT reputation INTO current_rep FROM users WHERE id = NEW.author_id;
    
    -- Calculate Target Change
    IF NEW.votable_type = 'question' THEN
      target_change := CASE WHEN NEW.vote_type = 'upvote' THEN 5 ELSE -1 END;
    ELSE
      target_change := CASE WHEN NEW.vote_type = 'upvote' THEN 10 ELSE -2 END;
    END IF;
    
    -- Calculate Actual Change (Floor Constraint logic for INSERT is still useful to properly set delta)
    IF target_change < 0 THEN
      actual_change := GREATEST(target_change, -current_rep);
    ELSE
      actual_change := target_change;
    END IF;
    
    NEW.reputation_delta := actual_change;
    
    -- Safe Update
    UPDATE users SET reputation = GREATEST(reputation + actual_change, 0) WHERE id = NEW.author_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- 1. Reverse the OLD vote
    -- KEY FIX: Use GREATEST(..., 0) to handle cases where user lost points elsewhere
    UPDATE users SET reputation = GREATEST(reputation - OLD.reputation_delta, 0) WHERE id = OLD.author_id;
    
    -- 2. Calculate NEW vote logic
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
    -- Reverse the OLD vote
    -- KEY FIX: Use GREATEST(..., 0)
    UPDATE users SET reputation = GREATEST(reputation - OLD.reputation_delta, 0) WHERE id = OLD.author_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Migration: 012_strict_reputation_tracking
-- Description: Add reputation_delta column and strict tracking trigger
-- Created: 2026-01-21

-- 1. Add reputation_delta column
ALTER TABLE votes ADD COLUMN reputation_delta INTEGER NOT NULL DEFAULT 0;

-- 2. Backfill with standard values (Best effort for legacy data)
-- Questions
UPDATE votes SET reputation_delta = 5 WHERE votable_type = 'question' AND vote_type = 'upvote';
UPDATE votes SET reputation_delta = -1 WHERE votable_type = 'question' AND vote_type = 'downvote';
-- Answers
UPDATE votes SET reputation_delta = 10 WHERE votable_type = 'answer' AND vote_type = 'upvote';
UPDATE votes SET reputation_delta = -2 WHERE votable_type = 'answer' AND vote_type = 'downvote';

-- 3. The Strict Trigger Function
CREATE OR REPLACE FUNCTION update_reputation_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  target_change INTEGER;
  actual_change INTEGER;
  current_rep INTEGER;
  intermediate_rep INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get current reputation of the author
    SELECT reputation INTO current_rep FROM users WHERE id = NEW.author_id;
    -- Lock row? No, single transaction usually sufficient for this logic level, strictly speaking SELECT FOR UPDATE is better but let's keep it simple for now unless high concurrency.
    
    -- Calculate Target Change
    IF NEW.votable_type = 'question' THEN
      target_change := CASE WHEN NEW.vote_type = 'upvote' THEN 5 ELSE -1 END;
    ELSE
      target_change := CASE WHEN NEW.vote_type = 'upvote' THEN 10 ELSE -2 END;
    END IF;
    
    -- Calculate Actual Change (Floor Constraint)
    -- If target is negative, max possible loss is current_rep
    IF target_change < 0 THEN
      actual_change := GREATEST(target_change, -current_rep);
    ELSE
      actual_change := target_change;
    END IF;
    
    -- Store delta on the vote record itself
    NEW.reputation_delta := actual_change;
    
    -- Update User
    UPDATE users SET reputation = reputation + actual_change WHERE id = NEW.author_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- 1. Reverse the OLD vote using its stored delta
    UPDATE users SET reputation = reputation - OLD.reputation_delta WHERE id = OLD.author_id;
    
    -- 2. Calculate NEW vote logic (as if it's a fresh insert, but on the updated user state)
    -- Fetch 'intermediate' reputation (after reversal)
    SELECT reputation INTO intermediate_rep FROM users WHERE id = NEW.author_id;
    
    -- Calculate Target Change
    IF NEW.votable_type = 'question' THEN
      target_change := CASE WHEN NEW.vote_type = 'upvote' THEN 5 ELSE -1 END;
    ELSE
      target_change := CASE WHEN NEW.vote_type = 'upvote' THEN 10 ELSE -2 END;
    END IF;
    
    -- Calculate Actual Change
    IF target_change < 0 THEN
      actual_change := GREATEST(target_change, -intermediate_rep);
    ELSE
      actual_change := target_change;
    END IF;
    
    -- Store new delta
    NEW.reputation_delta := actual_change;
    
    -- Update User (Add new delta)
    UPDATE users SET reputation = reputation + actual_change WHERE id = NEW.author_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Reverse the OLD vote using stored delta
    -- Note: author_id is now on the votes table (from Migration 011), so we just use OLD.author_id
    UPDATE users SET reputation = reputation - OLD.reputation_delta WHERE id = OLD.author_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Re-create Trigger (Needs to be BEFORE INSERT/UPDATE to set NEW.reputation_delta)
DROP TRIGGER IF EXISTS trigger_update_reputation_on_vote ON votes;

CREATE TRIGGER trigger_update_reputation_on_vote
BEFORE INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_reputation_on_vote();

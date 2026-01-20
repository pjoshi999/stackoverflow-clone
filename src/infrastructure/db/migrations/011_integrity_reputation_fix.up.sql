-- Migration: 011_integrity_reputation_fix
-- Description: Denormalize author_id to votes table and fix deletion integrity
-- Created: 2026-01-21

-- 1. Add author_id column (nullable first)
ALTER TABLE votes ADD COLUMN author_id INTEGER;

-- 2. Backfill author_id for Questions
UPDATE votes 
SET author_id = questions.user_id 
FROM questions 
WHERE votes.votable_type = 'question' AND votes.votable_id = questions.id;

-- 3. Backfill author_id for Answers
UPDATE votes 
SET author_id = answers.user_id 
FROM answers 
WHERE votes.votable_type = 'answer' AND votes.votable_id = answers.id;

-- 4. Delete orphan votes (where parent was deleted) to ensure constraints
DELETE FROM votes WHERE author_id IS NULL;

-- 5. Make author_id NOT NULL and add Foreign Key (optional, but good for integrity)
ALTER TABLE votes ALTER COLUMN author_id SET NOT NULL;
-- We don't add FK to users with CASCADE because we want to keep reputation history? 
-- Actually, if the Author is deleted, we probably want to keep the vote record?
-- But wait, if Author is deleted, their reputation doesn't matter.
-- Let's just keep it as an integer for now to avoid complexity with user deletion.

-- 6. Update the Trigger Function to use author_id directly
CREATE OR REPLACE FUNCTION update_reputation_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  reputation_change INTEGER;
  old_reputation_change INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- New vote
    IF NEW.votable_type = 'question' THEN
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 5 ELSE -1 END;
    ELSE
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 10 ELSE -2 END;
    END IF;
    
    UPDATE users SET reputation = GREATEST(reputation + reputation_change, 0) WHERE id = NEW.author_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Vote changed
    IF NEW.votable_type = 'question' THEN
      old_reputation_change := CASE WHEN OLD.vote_type = 'upvote' THEN -5 ELSE 1 END;
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 5 ELSE -1 END;
    ELSE
      old_reputation_change := CASE WHEN OLD.vote_type = 'upvote' THEN -10 ELSE 2 END;
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 10 ELSE -2 END;
    END IF;
    
    UPDATE users SET reputation = GREATEST(reputation + old_reputation_change + reputation_change, 0) WHERE id = NEW.author_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Vote removed (or parent deleted)
    -- Crucial: fetching from OLD.author_id, which still exists even if parent Question/Answer is gone!
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

DROP DATABASE IF EXISTS stackoverflow;
CREATE DATABASE stackoverflow;

\c stackoverflow;

CREATE TYPE vote_type_enum AS ENUM ('upvote', 'downvote');
CREATE TYPE commentable_type_enum AS ENUM ('question', 'answer');
CREATE TYPE votable_type_enum AS ENUM ('question', 'answer');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  reputation INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  search_vector tsvector,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0
);

CREATE TABLE question_tags (
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, tag_id)
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commentable_type commentable_type_enum NOT NULL,
  commentable_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  votable_type votable_type_enum NOT NULL,
  votable_id INTEGER NOT NULL,
  vote_type vote_type_enum NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_vote UNIQUE (user_id, votable_type, votable_id)
);

CREATE INDEX idx_questions_user_id ON questions(user_id);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX idx_questions_search_vector ON questions USING GIN(search_vector);

CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_user_id ON answers(user_id);
CREATE INDEX idx_answers_created_at ON answers(created_at);

CREATE INDEX idx_question_tags_tag_id ON question_tags(tag_id);

CREATE INDEX idx_comments_commentable ON comments(commentable_type, commentable_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

CREATE INDEX idx_votes_votable ON votes(votable_type, votable_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);

CREATE INDEX idx_users_reputation ON users(reputation DESC);
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);

CREATE OR REPLACE FUNCTION update_question_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.body, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_search_vector
BEFORE INSERT OR UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_question_search_vector();

CREATE OR REPLACE FUNCTION update_reputation_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id INTEGER;
  reputation_change INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.votable_type = 'question' THEN
      SELECT user_id INTO target_user_id FROM questions WHERE id = NEW.votable_id;
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 5 ELSE -1 END;
    ELSIF NEW.votable_type = 'answer' THEN
      SELECT user_id INTO target_user_id FROM answers WHERE id = NEW.votable_id;
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 10 ELSE -2 END;
    END IF;
    UPDATE users SET reputation = reputation + reputation_change WHERE id = target_user_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.votable_type = 'question' THEN
      SELECT user_id INTO target_user_id FROM questions WHERE id = NEW.votable_id;
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 5 ELSE -1 END;
      UPDATE users SET reputation = reputation + reputation_change - 
        (CASE WHEN OLD.vote_type = 'upvote' THEN 5 ELSE -1 END) WHERE id = target_user_id;
    ELSIF NEW.votable_type = 'answer' THEN
      SELECT user_id INTO target_user_id FROM answers WHERE id = NEW.votable_id;
      reputation_change := CASE WHEN NEW.vote_type = 'upvote' THEN 10 ELSE -2 END;
      UPDATE users SET reputation = reputation + reputation_change - 
        (CASE WHEN OLD.vote_type = 'upvote' THEN 10 ELSE -2 END) WHERE id = target_user_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.votable_type = 'question' THEN
      SELECT user_id INTO target_user_id FROM questions WHERE id = OLD.votable_id;
      reputation_change := CASE WHEN OLD.vote_type = 'upvote' THEN -5 ELSE 1 END;
    ELSIF OLD.votable_type = 'answer' THEN
      SELECT user_id INTO target_user_id FROM answers WHERE id = OLD.votable_id;
      reputation_change := CASE WHEN OLD.vote_type = 'upvote' THEN -10 ELSE 2 END;
    END IF;
    UPDATE users SET reputation = reputation + reputation_change WHERE id = target_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reputation_on_vote
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_reputation_on_vote();

CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tag_usage_count
AFTER INSERT OR DELETE ON question_tags
FOR EACH ROW
EXECUTE FUNCTION update_tag_usage_count();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_questions_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_answers_updated_at
BEFORE UPDATE ON answers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

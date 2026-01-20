# API Testing Guide

## Quick Start Testing

### 1. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 2. Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-01-20T15:35:58.123Z"
}
```

---

## Authentication Flow

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "reputation": 0
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Save the token for authenticated requests!**

---

## Questions

### Create a Question (Authenticated)

```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:3000/api/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "How do I optimize PostgreSQL queries?",
    "body": "I have a large table with millions of rows and my queries are slow. What are some strategies to improve performance?",
    "tags": ["postgresql", "performance", "database"]
  }'
```

### List Questions

```bash
# All questions
curl http://localhost:3000/api/questions

# With search
curl "http://localhost:3000/api/questions?q=postgresql"

# With tag filter
curl "http://localhost:3000/api/questions?tags=javascript,nodejs"

# With pagination
curl "http://localhost:3000/api/questions?page=1&limit=10"

# Combined
curl "http://localhost:3000/api/questions?q=performance&tags=postgresql&page=1&limit=20"
```

### Get Question Details

```bash
curl http://localhost:3000/api/questions/1
```

Response includes question, answers, comments, and vote counts.

### Vote on Question (Authenticated)

```bash
# Upvote
curl -X POST http://localhost:3000/api/questions/1/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"vote_type": "upvote"}'

# Downvote
curl -X POST http://localhost:3000/api/questions/1/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"vote_type": "downvote"}'

# Clicking same vote again removes it
```

---

## Answers

### Post an Answer (Authenticated)

```bash
curl -X POST http://localhost:3000/api/answers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "question_id": 1,
    "body": "You should start by adding indexes on columns used in WHERE clauses and JOIN conditions. Also consider using EXPLAIN ANALYZE to identify slow queries."
  }'
```

### Vote on Answer (Authenticated)

```bash
curl -X POST http://localhost:3000/api/answers/1/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"vote_type": "upvote"}'
```

---

## Comments

### Add Comment to Question (Authenticated)

```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "commentable_type": "question",
    "commentable_id": 1,
    "body": "Have you tried using connection pooling?"
  }'
```

### Add Comment to Answer (Authenticated)

```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "commentable_type": "answer",
    "commentable_id": 1,
    "body": "Great answer! This helped me a lot."
  }'
```

---

## Users

### Get User Profile

```bash
curl http://localhost:3000/api/users/1
```

Response includes:
- User info with reputation
- Question count and answer count
- Recent questions (last 10)
- Recent answers (last 10)

### Get Top Users

```bash
# Top 10 users
curl http://localhost:3000/api/users/top

# Top 20 users
curl "http://localhost:3000/api/users/top?limit=20"
```

---

## Testing Reputation System

1. **Create two users** (User A and User B)
2. **User A posts a question** - reputation stays at 0
3. **User B upvotes the question** - User A gets +5 reputation
4. **User A posts an answer** - reputation stays at 5
5. **User B upvotes the answer** - User A gets +10 reputation (total: 15)
6. **User B downvotes the answer** - User A loses 12 reputation (total: 3)

Check reputation changes:
```bash
curl http://localhost:3000/api/users/1
```

---

## Testing Full-Text Search

Create questions with different content, then test search:

```bash
# Search for "postgresql"
curl "http://localhost:3000/api/questions?q=postgresql"

# Search for "performance optimization"
curl "http://localhost:3000/api/questions?q=performance+optimization"

# Results are ranked by relevance using ts_rank
```

---

## Testing Cache Performance

1. **First search** - will query database
2. **Same search within 5 minutes** - will return cached results (faster)
3. **After 5 minutes** - cache expires, queries database again

The cache automatically invalidates when:
- New questions are created
- Questions are voted on
- Answers or comments are added

---

## Error Handling Examples

### Invalid Registration (Duplicate Email)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe2",
    "email": "john@example.com",
    "password": "password123"
  }'
```

Response: `400 Bad Request`

### Unauthorized Access

```bash
curl -X POST http://localhost:3000/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "body": "Test body",
    "tags": ["test"]
  }'
```

Response: `401 Unauthorized`

### Validation Errors

```bash
curl -X POST http://localhost:3000/api/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Short",
    "body": "Too short",
    "tags": ["test"]
  }'
```

Response: `400 Bad Request` with validation errors

---

## Postman Collection (Optional)

Import these as a Postman collection for easier testing:

1. **Set Environment Variable**: `BASE_URL = http://localhost:3000`
2. **Set Token Variable**: `TOKEN = <your_jwt_token>`
3. Use `{{BASE_URL}}` and `{{TOKEN}}` in requests

---

## Database Queries to Verify

Connect to PostgreSQL and check:

```sql
-- Check user reputation
SELECT username, reputation FROM users ORDER BY reputation DESC;

-- Check vote counts
SELECT 
  q.id, 
  q.title,
  COUNT(v.id) as vote_count,
  SUM(CASE WHEN v.vote_type = 'upvote' THEN 1 ELSE -1 END) as net_votes
FROM questions q
LEFT JOIN votes v ON q.id = v.votable_id AND v.votable_type = 'question'
GROUP BY q.id;

-- Check tag usage
SELECT name, usage_count FROM tags ORDER BY usage_count DESC;

-- Test full-text search
SELECT title FROM questions WHERE search_vector @@ plainto_tsquery('english', 'postgresql');
```

---

## Performance Testing

Use Apache Bench or similar tools:

```bash
# Test search endpoint
ab -n 1000 -c 10 "http://localhost:3000/api/questions?q=test"

# Should see improved response times for cached results
```

---

## Next Steps

1. ✅ Test all endpoints manually
2. ✅ Verify reputation calculations
3. ✅ Test search functionality
4. ✅ Check cache performance
5. ✅ Verify database triggers
6. 🔄 Integrate with frontend
7. 🔄 Deploy to production

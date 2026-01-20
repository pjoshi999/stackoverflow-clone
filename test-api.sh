#!/bin/bash

# Stack Overflow Backend - Quick Test Script
# This script tests all major endpoints

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Starting Stack Overflow Backend Tests..."
echo ""

echo "1. Testing Health Check..."
HEALTH=$(curl -s $BASE_URL/health)
if [[ $HEALTH == *"OK"* ]]; then
  echo -e "${GREEN}✓${NC} Health check passed"
else
  echo -e "${RED}✗${NC} Health check failed"
fi
echo ""

echo "2. Registering User..."
REGISTER=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser_'$RANDOM'",
    "email": "test'$RANDOM'@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $REGISTER | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [[ -n $TOKEN ]]; then
  echo -e "${GREEN}✓${NC} User registered successfully"
  echo "   Token: ${TOKEN:0:20}..."
else
  echo -e "${RED}✗${NC} User registration failed"
  echo "   Response: $REGISTER"
fi
echo ""

echo "3. Creating Question..."
QUESTION=$(curl -s -X POST $BASE_URL/api/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "How do I optimize PostgreSQL queries for better performance?",
    "body": "I have a large table with millions of rows and my queries are taking too long. What are some best practices for optimization?",
    "tags": ["postgresql", "performance", "database", "optimization"]
  }')

QUESTION_ID=$(echo $QUESTION | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

if [[ -n $QUESTION_ID ]]; then
  echo -e "${GREEN}✓${NC} Question created (ID: $QUESTION_ID)"
else
  echo -e "${RED}✗${NC} Question creation failed"
fi
echo ""

echo "4. Listing Questions..."
QUESTIONS=$(curl -s "$BASE_URL/api/questions?limit=5")
TOTAL=$(echo $QUESTIONS | grep -o '"total":[0-9]*' | sed 's/"total"://')

if [[ -n $TOTAL ]]; then
  echo -e "${GREEN}✓${NC} Questions listed (Total: $TOTAL)"
else
  echo -e "${RED}✗${NC} Listing questions failed"
fi
echo ""

echo "5. Searching Questions..."
SEARCH=$(curl -s "$BASE_URL/api/questions?q=postgresql")
SEARCH_TOTAL=$(echo $SEARCH | grep -o '"total":[0-9]*' | sed 's/"total"://')

if [[ -n $SEARCH_TOTAL ]]; then
  echo -e "${GREEN}✓${NC} Search completed (Found: $SEARCH_TOTAL)"
else
  echo -e "${RED}✗${NC} Search failed"
fi
echo ""

if [[ -n $QUESTION_ID ]]; then
  echo "6. Getting Question Details..."
  DETAILS=$(curl -s "$BASE_URL/api/questions/$QUESTION_ID")
  TITLE=$(echo $DETAILS | grep -o '"title":"[^"]*' | sed 's/"title":"//')
  
  if [[ -n $TITLE ]]; then
    echo -e "${GREEN}✓${NC} Question details retrieved"
  else
    echo -e "${RED}✗${NC} Failed to get question details"
  fi
  echo ""

  echo "7. Posting Answer..."
  ANSWER=$(curl -s -X POST $BASE_URL/api/answers \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "question_id": '$QUESTION_ID',
      "body": "Start by adding indexes on frequently queried columns, especially those used in WHERE clauses and JOIN conditions. Use EXPLAIN ANALYZE to identify bottlenecks. Consider partitioning large tables and using connection pooling."
    }')
  
  ANSWER_ID=$(echo $ANSWER | grep -o '"id":[0-9]*' | sed 's/"id"://')
  
  if [[ -n $ANSWER_ID ]]; then
    echo -e "${GREEN}✓${NC} Answer posted (ID: $ANSWER_ID)"
  else
    echo -e "${RED}✗${NC} Failed to post answer"
  fi
  echo ""

  echo "8. Adding Comment..."
  COMMENT=$(curl -s -X POST $BASE_URL/api/comments \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "commentable_type": "question",
      "commentable_id": '$QUESTION_ID',
      "body": "Have you considered using query caching?"
    }')
  
  COMMENT_ID=$(echo $COMMENT | grep -o '"id":[0-9]*' | sed 's/"id"://')
  
  if [[ -n $COMMENT_ID ]]; then
    echo -e "${GREEN}✓${NC} Comment added (ID: $COMMENT_ID)"
  else
    echo -e "${RED}✗${NC} Failed to add comment"
  fi
  echo ""

  echo "9. Voting on Question..."
  VOTE=$(curl -s -X POST "$BASE_URL/api/questions/$QUESTION_ID/vote" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"vote_type": "upvote"}')
  
  if [[ $VOTE == *"Vote recorded"* ]]; then
    echo -e "${GREEN}✓${NC} Vote recorded"
  else
    echo -e "${RED}✗${NC} Failed to vote"
  fi
  echo ""
fi

echo "10. Getting Top Users..."
TOP_USERS=$(curl -s "$BASE_URL/api/users/top?limit=5")

if [[ $TOP_USERS == *"username"* ]]; then
  echo -e "${GREEN}✓${NC} Top users retrieved"
else
  echo -e "${RED}✗${NC} Failed to get top users"
fi
echo ""

echo "🎉 Test suite completed!"
echo ""
echo "📝 For manual testing, use the token below:"
echo "   $TOKEN"

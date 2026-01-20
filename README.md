# Stack Overflow Backend API

High-performance Stack Overflow-like backend built with Express, TypeScript, and PostgreSQL using raw SQL queries for maximum performance.

## Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **Questions**: Create, list, search with full-text search, vote
- **Answers**: Post answers, vote, reputation tracking
- **Comments**: Comment on questions and answers
- **User Profiles**: View user reputation and contributions
- **Reputation System**: Automatic reputation calculation via database triggers
- **Optimizations**: PostgreSQL full-text search, query caching, optimized indexes

## Tech Stack

- Express.js + TypeScript
- PostgreSQL with raw SQL queries
- JWT authentication
- bcryptjs for password hashing
- In-memory caching

## Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

3. **Setup database**:
```bash
npm run db:setup
```

4. **Run development server**:
```bash
npm run dev
```

5. **Build for production**:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh access token

### Questions
- `GET /api/questions` - List questions (supports `?q=search&tags=tag1,tag2&page=1&limit=20`)
- `GET /api/questions/:id` - Get question details with answers and comments
- `POST /api/questions` - Create question (authenticated)
- `POST /api/questions/:id/vote` - Vote on question (authenticated)

### Answers
- `POST /api/answers` - Post answer (authenticated)
- `POST /api/answers/:id/vote` - Vote on answer (authenticated)

### Comments
- `POST /api/comments` - Add comment (authenticated)

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/top` - Get top users by reputation

## Database Schema

Tables: `users`, `questions`, `answers`, `tags`, `question_tags`, `comments`, `votes`

Features:
- Full-text search on questions using tsvector
- Automatic reputation updates via triggers
- Tag usage tracking via triggers
- Optimized indexes for performance

## Reputation System

- Answer upvote: +10
- Answer downvote: -2
- Question upvote: +5
- Question downvote: -1

Reputation is automatically calculated and updated via PostgreSQL triggers.

## Performance Optimizations

- PostgreSQL GIN indexes for full-text search
- In-memory caching for search results
- Optimized queries using CTEs and efficient joins
- Connection pooling
- Parameterized queries for security

## Project Structure

```
src/
├── db/
│   ├── schema.sql      # Database schema
│   └── db.ts           # Connection pool
├── middleware/
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── validation.middleware.ts
├── modules/
│   ├── auth/
│   ├── questions/
│   ├── answers/
│   ├── comments/
│   └── users/
├── types/
│   └── types.ts
├── utils/
│   └── cache.service.ts
└── server.ts
```

## License

ISC

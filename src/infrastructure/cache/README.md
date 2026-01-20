# Cache Infrastructure

This module provides Redis-based caching functionality with a clean separation of concerns.

## Structure

```
cache/
├── redis.client.ts    # Redis client configuration and connection
├── cache.service.ts   # Cache operations using Redis client
└── index.ts          # Barrel exports for clean imports
```

## Files

### `redis.client.ts`
- Redis client configuration with `ioredis`
- Connection management and event handlers
- BullMQ queue configuration
- Connection status tracking

### `cache.service.ts`
- High-level cache operations (get, set, delete, invalidate)
- Graceful degradation when Redis is unavailable
- Type-safe caching with generics

### `index.ts`
- Barrel exports for clean imports
- Re-exports both Redis client and cache service

## Usage

### Using Cache Service

```typescript
import { cacheGet, cacheSet, cacheDelete } from "@/infrastructure/cache";

// Set cache
await cacheSet("user:123", userData, 600); // 600 seconds TTL

// Get cache
const user = await cacheGet<User>("user:123");

// Delete cache
await cacheDelete("user:123");

// Invalidate pattern
await cacheInvalidatePattern("users:*");
```

### Using Redis Client Directly (for BullMQ, etc.)

```typescript
import { redis, queueConfig } from "@/infrastructure/cache";

// Use redis client directly
await redis.lpush("mylist", "value");

// Use queue config with BullMQ
import { Queue } from "bullmq";
const myQueue = new Queue("myqueue", queueConfig);
```

## Features

- ✅ Automatic reconnection with exponential backoff
- ✅ Graceful degradation when Redis is unavailable
- ✅ Type-safe caching with TypeScript generics
- ✅ BullMQ integration ready
- ✅ Connection status monitoring
- ✅ Configurable TTL (Time To Live)
- ✅ Pattern-based cache invalidation

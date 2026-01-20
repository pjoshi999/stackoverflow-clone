import { redis, isRedisAvailable } from "./redis.client";

const DEFAULT_TTL = 300; // 5 minutes in seconds

/**
 * Get a cached value by key
 * @param key - Cache key
 * @returns Parsed cached value or null if not found/unavailable
 */
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!isRedisAvailable()) return null;

  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("❌ Redis GET error:", error);
    return null;
  }
};

/**
 * Set a cached value with TTL
 * @param key - Cache key
 * @param value - Value to cache (will be JSON stringified)
 * @param ttl - Time to live in seconds (default: 300s / 5min)
 */
export const cacheSet = async <T>(
  key: string,
  value: T,
  ttl: number = DEFAULT_TTL,
): Promise<void> => {
  if (!isRedisAvailable()) return;

  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error("❌ Redis SET error:", error);
  }
};

/**
 * Delete a cached value by key
 * @param key - Cache key to delete
 */
export const cacheDelete = async (key: string): Promise<void> => {
  if (!isRedisAvailable()) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error("❌ Redis DELETE error:", error);
  }
};

/**
 * Invalidate all cache keys matching a pattern
 * @param pattern - Redis key pattern (e.g., "users:*")
 */
export const cacheInvalidatePattern = async (
  pattern: string,
): Promise<void> => {
  if (!isRedisAvailable()) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("❌ Redis INVALIDATE error:", error);
  }
};

/**
 * Check if Redis cache is available
 */
export const isCacheAvailable = (): boolean => {
  return isRedisAvailable();
};

// Export default cache service
export default {
  get: cacheGet,
  set: cacheSet,
  delete: cacheDelete,
  invalidatePattern: cacheInvalidatePattern,
  isAvailable: isCacheAvailable,
};

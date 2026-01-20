import Redis from "ioredis";
import { redisConfig } from "../../config/env";

export const redis = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    return Math.min(times * 50, 5000); // Retry every 50ms, up to 5 seconds
  },
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redis.setMaxListeners(50);

let isConnected = false;

redis.on("connect", () => {
  console.log("✅ Redis Connecting...");
});

redis.on("ready", () => {
  isConnected = true;
  console.log("✅ Redis Connected and Ready.");
});

redis.on("error", (err) => {
  console.error("❌ Redis Client Error", err);
});

redis.on("reconnecting", () => {
  console.log("♻️ Redis Reconnecting...");
});

// Export queue configuration for BullMQ
export const queueConfig = {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: "exponential" as const,
      delay: 2000,
    },
  },
};

// Initialize connection if Redis is configured
const initRedis = async () => {
  if (!redisConfig.host) {
    console.log("⚠️  Redis not configured - caching will be disabled");
    return;
  }

  try {
    await redis.connect();
  } catch (error) {
    console.error("❌ Failed to connect to Redis:", error);
  }
};

// Initialize on module load
initRedis();

// Helper function to check if Redis is available
export const isRedisAvailable = (): boolean => {
  return isConnected && redisConfig.host !== undefined;
};

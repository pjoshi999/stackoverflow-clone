import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Define the schema for environment variables
const envSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .default("3000")
    .transform((val) => parseInt(val, 10)),

  // Database
  DB_HOST: z.string().min(1, "DB_HOST is required"),
  DB_PORT: z
    .string()
    .default("5432")
    .transform((val) => parseInt(val, 10)),
  DB_NAME: z.string().min(1, "DB_NAME is required"),
  DB_USER: z.string().min(1, "DB_USER is required"),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),

  // JWT
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"), // Short expiry for access token
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"), // Long expiry for refresh token

  // Redis (optional for caching)
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z
    .string()
    .optional()
    .default("6379")
    .transform((val) => parseInt(val, 10)),
  REDIS_PASSWORD: z.string().optional(),

  // Cache
  CACHE_TTL: z
    .string()
    .default("300000")
    .transform((val) => parseInt(val, 10)),
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:");
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  throw new Error("Environment validation failed");
}

// Export typed and validated config
export const config = parsedEnv.data;

// Export individual config sections for convenience
export const appConfig = {
  env: config.NODE_ENV,
  port: config.PORT,
  isDevelopment: config.NODE_ENV === "development",
  isProduction: config.NODE_ENV === "production",
  isTest: config.NODE_ENV === "test",
};

export const dbConfig = {
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
};

export const jwtConfig = {
  secret: config.JWT_SECRET,
  expiresIn: config.JWT_EXPIRES_IN,
  refreshSecret: config.JWT_REFRESH_SECRET,
  refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
};

export const redisConfig = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
};

export const cacheConfig = {
  ttl: config.CACHE_TTL,
};

import { Pool, PoolConfig } from "pg";
import { dbConfig, appConfig } from "../../config/env";

const poolConfig: PoolConfig = {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,

  ssl: appConfig.isProduction
    ? {
        rejectUnauthorized: false,
      }
    : undefined,

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(1);
});

export default pool;

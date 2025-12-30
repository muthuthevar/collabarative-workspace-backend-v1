import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../../.env") });

interface Config {
  env: string;
  port: number;
  apiVersion: string;
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
    password: string;
    db: number;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  cors: {
    origin: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    filePath: string;
  };
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const config: Config = {
  env: getEnvVar("NODE_ENV", "development"),
  port: parseInt(getEnvVar("PORT", "3000"), 10),
  apiVersion: getEnvVar("API_VERSION", "v1"),
  database: {
    url: getEnvVar("DATABASE_URL"),
  },
  redis: {
    host: getEnvVar("REDIS_HOST", "localhost"),
    port: parseInt(getEnvVar("REDIS_PORT", "6379"), 10),
    password: getEnvVar("REDIS_PASSWORD", ""),
    db: parseInt(getEnvVar("REDIS_DB", "0"), 10),
  },
  jwt: {
    secret: getEnvVar("JWT_SECRET"),
    refreshSecret: getEnvVar("JWT_REFRESH_SECRET"),
    expiresIn: getEnvVar("JWT_EXPIRES_IN", "15m"),
    refreshExpiresIn: getEnvVar("JWT_REFRESH_EXPIRES_IN", "7d"),
  },
  cors: {
    origin: getEnvVar("CORS_ORIGIN", "*"),
  },
  rateLimit: {
    windowMs: parseInt(getEnvVar("RATE_LIMIT_WINDOW_MS", "900000"), 10),
    maxRequests: parseInt(getEnvVar("RATE_LIMIT_MAX_REQUESTS", "100"), 10),
  },
  logging: {
    level: getEnvVar("LOG_LEVEL", "info"),
    filePath: getEnvVar("LOG_FILE_PATH", "logs/app.log"),
  },
};

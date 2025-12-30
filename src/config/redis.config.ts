import { createClient, type RedisClientType } from "redis";
import { config } from "./env.config.js";
import { logger } from "../utils/logger.js";

class RedisConfig {
  private static instance: RedisClientType;

  private constructor() {}

  public static async getInstance(): Promise<RedisClientType> {
    if (!RedisConfig.instance) {
      RedisConfig.instance = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
        database: config.redis.db,
      });

      RedisConfig.instance.on("connect", () => {
        logger.info("Redis connection established");
      });

      RedisConfig.instance.on("error", (err) => {
        logger.error("Redis error", err);
      });

      await RedisConfig.instance.connect();
    }

    return RedisConfig.instance;
  }

  public static async disconnect(): Promise<void> {
    if (RedisConfig.instance) {
      await RedisConfig.instance.quit();
      logger.info("Redis connection closed");
    }
  }
}

export { RedisConfig };

import { createApp } from "./app.js";
import { config } from "./config/env.config.js";
import { logger } from "./utils/logger.js";
import { prisma } from "./config/prisma.config.js";
import { RedisConfig } from "./config/redis.config.js";

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info("Database connected successfully");

    // Test Redis connection
    await RedisConfig.getInstance();
    logger.info("Redis connected successfully");

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`API URL: http://localhost:${config.port}/api/v1`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

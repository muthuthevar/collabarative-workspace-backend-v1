import { createApp } from "./app.js";
import { config } from "./config/env.config.js";
import { logger } from "./utils/logger.js";
import { prisma } from "./config/prisma.config.js";
import { RedisConfig } from "./config/redis.config.js";
import { WebSocketServer } from "ws";
import { createServer } from "node:http";
import { WebSocketManager } from "./websocket/WebSocketManager.js";

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

    const server = createServer(app)


    // Create websocket server
    const wss = new WebSocketServer({
      server,
      path: '/ws'
    });

    const wsManager = new WebSocketManager(wss)
    wss.on("connection", (ws, request) => {
      wsManager.handleConnection(ws, request)
    })

    // Start server
    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`API URL: http://localhost:${config.port}/api/v1`);
      logger.info(`WebSocket URL: ws://localhost:${config.port}/ws`)
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

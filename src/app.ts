import compression from "compression";
import cors from "cors";
import express, { type Application } from "express";
import helmet from "helmet";
import { apiLimiter } from "./middleware/rate-limit.middleware.js";
import router from "./routes/index.js";
import { errorHandler, notFoundError } from "./middleware/error.middleware.js";
import { config } from "./config/env.config.js";

export const createApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(compression());
  app.use(apiLimiter);

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.use("/api/v1", router);
  app.use(notFoundError);
  app.use(errorHandler);
  return app;
};

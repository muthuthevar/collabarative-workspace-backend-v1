import winston from "winston";
import { config } from "../config/env.config.js";
import { resolve } from "path";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: resolve(config.logging.filePath),
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: resolve("logs/error.log"),
      level: "error",
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

if (config.env !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

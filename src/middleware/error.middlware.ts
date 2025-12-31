import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/errors.js";
import { ResponseHandler } from "../utils/response.js";

export const errorHandler = (err: Error, req: Request, res: Response) => {
  logger.error("Error occurred: ", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    ResponseHandler.error(res, err.message, err.statusCode);
    return;
  }
  ResponseHandler.error(res, "Internal server error", 500);
};

export const notFoundError = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  ResponseHandler.error(res, `Route ${req.originalUrl} not found`, 404);
};

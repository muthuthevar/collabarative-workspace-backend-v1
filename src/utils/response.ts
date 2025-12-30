import { type Response } from "express";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: Record<string, unknown>;
}

export class ResponseHandler {
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200,
    meta?: Record<string, unknown>
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      ...(message && { message }),
      ...(meta && { meta }),
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    error?: string
  ): Response {
    const response: ApiResponse<null> = {
      success: false,
      message,
      ...(error && { error }),
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data: T,
    message = "Resource created"
  ): Response {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}

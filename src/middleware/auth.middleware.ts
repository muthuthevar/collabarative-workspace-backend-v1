import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../utils/errors.js";
import { JwtUtil } from "../utils/jwt.util.js";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError(`No token provided`);
    }
    const token = authHeader.substring(7);
    const payload = JwtUtil.verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };
    next();
  } catch (error) {
    next(error);
  }
};

import jwt from "jsonwebtoken";
import { config } from "../config/env.config.js";
import { UnauthorizedError } from "./errors.js";

export interface JwtPayload {
  userId: string;
  email: string;
}

export class JwtUtil {
  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);
  }

  static verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (error) {
      throw new UnauthorizedError(`Invalid or expired access token`);
    }
  }

  static verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
    } catch (error) {
      throw new UnauthorizedError(`Invalid or expired refresh token`);
    }
  }
}

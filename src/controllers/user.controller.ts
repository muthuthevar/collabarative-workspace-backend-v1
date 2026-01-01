import type { Response, NextFunction } from "express";
import { UserService } from "../services/User.service.js";
import { ResponseHandler } from "../utils/response.js";
import { type AuthRequest } from "../middleware/auth.middleware.js";

export class AuthController {
  constructor(private userService: UserService) {}

  async register(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.userService.register(req.body);
      ResponseHandler.created(res, result, "User registered successfully");
    } catch (error) {
      next(error);
    }
  }

  async login(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.userService.login(req.body);
      ResponseHandler.success(res, result, "Login successful");
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await this.userService.refreshToken(refreshToken);
      ResponseHandler.success(res, result, "Token refreshed successfully");
    } catch (error) {
      next(error);
    }
  }

  getProfile = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.userService.getUserById(req.user!.userId);
      ResponseHandler.success(res, user);
    } catch (error) {
      next(error);
    }
  };

  async updateProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await this.userService.updateUser(
        req.user!.userId,
        req.body
      );
      ResponseHandler.success(res, user, "Profile updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await this.userService.deleteUser(req.user!.userId);
      ResponseHandler.noContent(res);
    } catch (error) {
      next(error);
    }
  }
}

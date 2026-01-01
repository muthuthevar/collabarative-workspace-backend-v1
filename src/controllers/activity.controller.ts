import type { Response, NextFunction } from "express";
import { ActivityLogService } from "../services/ActivityLog.service.js";
import { ResponseHandler } from "../utils/response.js";
import { type AuthRequest } from "../middleware/auth.middleware.js";

export class ActivityController {
  constructor(private activityLogService: ActivityLogService) {}

  async getWorkspaceActivities(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;

      const activities = await this.activityLogService.getWorkspaceActivityLogs(
        req.params.workspaceId!,
        req.user!.userId,
        limit
      );
      ResponseHandler.success(res, activities);
    } catch (error) {
      next(error);
    }
  }

  async getUserActivities(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;

      const activities = await this.activityLogService.getUserActivityLogs(
        req.user!.userId,
        limit
      );
      ResponseHandler.success(res, activities);
    } catch (error) {
      next(error);
    }
  }
}

import { Router } from "express";
import { ActivityController } from "../controllers/activity.controller.js";
import { ActivityLogService } from "../services/ActivityLog.service.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { ActivityLogRepository } from "../repositories/implementations/ActivityLog.repository.js";

const router = Router();
const activityLogRepository = new ActivityLogRepository();
const activityLogService = new ActivityLogService(activityLogRepository);
const activityController = new ActivityController(activityLogService);

// All routes require authentication
router.use(authenticate);

router.get(
  "/workspace/:workspaceId",
  activityController.getWorkspaceActivities.bind(activityController)
);

router.get(
  "/user",
  activityController.getUserActivities.bind(activityController)
);

export default router;

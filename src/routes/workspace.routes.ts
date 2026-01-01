import { Router } from "express";
import { WorkspaceController } from "../controllers/workspace.controller.js";
import { WorkspaceService } from "../services/Workspace.service.js";
import { WorkspaceRepository } from "../repositories/implementations/Workspace.repository.js";
import { ActivityLogRepository } from "../repositories/implementations/ActivityLog.repository.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addMemberSchema,
  updateMemberRoleSchema,
} from "../validators/workspace.validator.js";

const router = Router();
const workspaceRepository = new WorkspaceRepository();
const activityLogRepository = new ActivityLogRepository();
const workspaceService = new WorkspaceService(
  workspaceRepository,
  activityLogRepository
);
const workspaceController = new WorkspaceController(workspaceService);

// All routes require authentication
router.use(authenticate);

router.post(
  "/",
  validate(createWorkspaceSchema),
  workspaceController.create.bind(workspaceController)
);

router.get(
  "/",
  workspaceController.getUserWorkspaces.bind(workspaceController)
);

router.get("/:id", workspaceController.getById.bind(workspaceController));

router.put(
  "/:id",
  validate(updateWorkspaceSchema),
  workspaceController.update.bind(workspaceController)
);

router.delete("/:id", workspaceController.delete.bind(workspaceController));

// Member management
router.post(
  "/:id/members",
  validate(addMemberSchema),
  workspaceController.addMember.bind(workspaceController)
);

router.delete(
  "/:id/members/:userId",
  workspaceController.removeMember.bind(workspaceController)
);

router.patch(
  "/:id/members/:userId/role",
  validate(updateMemberRoleSchema),
  workspaceController.updateMemberRole.bind(workspaceController)
);

export default router;

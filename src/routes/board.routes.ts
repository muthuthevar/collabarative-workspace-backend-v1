import { Router } from "express";
import { BoardController } from "../controllers/board.controller.js";
import { BoardService } from "../services/Board.service.js";
import { BoardRepository } from "../repositories/implementations/Board.repository.js";
import { WorkspaceRepository } from "../repositories/implementations/Workspace.repository.js";
import { ActivityLogRepository } from "../repositories/implementations/ActivityLog.repository.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createBoardSchema,
  updateBoardSchema,
} from "../validators/board.validator.js";

const router = Router();
const boardRepository = new BoardRepository();
const workspaceRepository = new WorkspaceRepository();
const activityLogRepository = new ActivityLogRepository();
const boardService = new BoardService(
  boardRepository,
  workspaceRepository,
  activityLogRepository
);
const boardController = new BoardController(boardService);

// All routes require authentication
router.use(authenticate);

router.post(
  "/",
  validate(createBoardSchema),
  boardController.create.bind(boardController)
);

router.get("/:id", boardController.getById.bind(boardController));

router.get(
  "/workspace/:workspaceId",
  boardController.getWorkspaceBoards.bind(boardController)
);

router.put(
  "/:id",
  validate(updateBoardSchema),
  boardController.update.bind(boardController)
);

export default router;

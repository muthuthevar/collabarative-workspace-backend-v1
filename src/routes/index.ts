import { Router } from "express";
import authRoutes from "./auth.routes.js";
import workspaceRoutes from "./workspace.routes.js";
import boardRoutes from "./board.routes.js";
import activityRoutes from "./activity.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/boards", boardRoutes);
router.use("/activities", activityRoutes);

export default router;

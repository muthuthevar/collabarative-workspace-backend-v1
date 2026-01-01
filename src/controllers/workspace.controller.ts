import type { Response, NextFunction } from "express";
import { WorkspaceService } from "../services/Workspace.service.js";
import { ResponseHandler } from "../utils/response.js";
import { type AuthRequest } from "../middleware/auth.middleware.js";

export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  async create(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const workspace = await this.workspaceService.createWorkspace({
        name: req.body.name,
        ownerId: req.user!.userId,
      });
      ResponseHandler.created(res, workspace, "Workspace created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const workspace = await this.workspaceService.getWorkspaceById(
        req.params.id!,
        req.user!.userId
      );
      ResponseHandler.success(res, workspace);
    } catch (error) {
      next(error);
    }
  }

  getUserWorkspaces = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const workspaces = await this.workspaceService.getUserWorkspaces(
        req.user!.userId
      );
      ResponseHandler.success(res, workspaces);
    } catch (error) {
      next(error);
    }
  };

  async update(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const workspace = await this.workspaceService.updateWorkspace(
        req.params.id!,
        req.user!.userId,
        req.body
      );
      ResponseHandler.success(res, workspace, "Workspace updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async delete(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await this.workspaceService.deleteWorkspace(
        req.params.id!,
        req.user!.userId
      );
      ResponseHandler.noContent(res);
    } catch (error) {
      next(error);
    }
  }

  async addMember(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const member = await this.workspaceService.addMember({
        workspaceId: req.params.id!,
        userId: req.body.userId,
        role: req.body.role,
        requesterId: req.user!.userId,
      });
      ResponseHandler.created(res, member, "Member added successfully");
    } catch (error) {
      next(error);
    }
  }

  async removeMember(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await this.workspaceService.removeMember(
        req.params.id!,
        req.params.userId!,
        req.user!.userId
      );
      ResponseHandler.noContent(res);
    } catch (error) {
      next(error);
    }
  }

  updateMemberRole = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const member = await this.workspaceService.updateMemberRole(
        req.params.id!,
        req.params.userId!,
        req.body.role,
        req.user!.userId
      );
      ResponseHandler.success(res, member, "Member role updated successfully");
    } catch (error) {
      next(error);
    }
  };
}

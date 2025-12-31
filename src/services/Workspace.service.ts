import { Workspace } from "../domain/entities/Workspace.entity.js";
import { WorkspaceMember } from "../domain/entities/WorkspaceMember.entity.js";
import { Role } from "../domain/enums/Role.enum.js";
import { hasPermission, Permission } from "../domain/enums/Permission.enum.js";
import { type IWorkspaceRepository } from "../repositories/interfaces/IWorkspaceRepository.js";
import { type IActivityLogRepository } from "../repositories/interfaces/IActivityLogRepository.js";
import { WorkspaceRepository } from "../repositories/implementations/Workspace.repository.js";
import { ActivityLogRepository } from "../repositories/implementations/ActivityLog.repository.js";
import { ActivityType } from "../domain/enums/ActivityType.enum.js";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export interface CreateWorkspaceDto {
  name: string;
  ownerId: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
}

export interface AddMemberDto {
  workspaceId: string;
  userId: string;
  role: string;
  requesterId: string;
}

export class WorkspaceService {
  private workspaceRepository: IWorkspaceRepository;
  private activityLogRepository: IActivityLogRepository;

  constructor(
    workspaceRepository?: IWorkspaceRepository,
    activityLogRepository?: IActivityLogRepository
  ) {
    this.workspaceRepository = workspaceRepository || new WorkspaceRepository();
    this.activityLogRepository =
      activityLogRepository || new ActivityLogRepository();
  }

  async createWorkspace(data: CreateWorkspaceDto): Promise<Workspace> {
    const workspace = await this.workspaceRepository.create(data);

    await this.activityLogRepository.create({
      workspaceId: workspace.id,
      userId: data.ownerId,
      action: ActivityType.WORKSPACE_CREATED,
      metadata: { workspaceName: workspace.name },
    });

    logger.info(`Workspace created: ${workspace.id}`);

    return workspace;
  }

  async getWorkspaceById(
    workspaceId: string,
    userId: string
  ): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    const isMember = await this.workspaceRepository.isMember(
      workspaceId,
      userId
    );
    if (!isMember) {
      throw new ForbiddenError("You are not a member of this workspace");
    }

    return workspace;
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    return await this.workspaceRepository.findByUserId(userId);
  }

  async updateWorkspace(
    workspaceId: string,
    userId: string,
    data: UpdateWorkspaceDto
  ): Promise<Workspace> {
    await this.checkPermission(
      workspaceId,
      userId,
      Permission.WORKSPACE_UPDATE
    );

    const workspace = await this.workspaceRepository.update(workspaceId, data);

    await this.activityLogRepository.create({
      workspaceId,
      userId,
      action: ActivityType.WORKSPACE_UPDATED,
      metadata: { updates: data },
    });

    logger.info(`Workspace updated: ${workspaceId}`);

    return workspace;
  }

  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    await this.checkPermission(
      workspaceId,
      userId,
      Permission.WORKSPACE_DELETE
    );

    await this.workspaceRepository.delete(workspaceId);

    logger.info(`Workspace deleted: ${workspaceId}`);
  }

  async addMember(data: AddMemberDto): Promise<WorkspaceMember> {
    await this.checkPermission(
      data.workspaceId,
      data.requesterId,
      Permission.MEMBER_INVITE
    );

    const isMember = await this.workspaceRepository.isMember(
      data.workspaceId,
      data.userId
    );
    if (isMember) {
      throw new ConflictError("User is already a member");
    }

    const member = await this.workspaceRepository.addMember({
      workspaceId: data.workspaceId,
      userId: data.userId,
      role: data.role as Role,
    });

    await this.activityLogRepository.create({
      workspaceId: data.workspaceId,
      userId: data.requesterId,
      action: ActivityType.MEMBER_ADDED,
      metadata: { addedUserId: data.userId, role: data.role },
    });

    logger.info(`Member added to workspace: ${data.workspaceId}`);

    return member;
  }

  async removeMember(
    workspaceId: string,
    userId: string,
    requesterId: string
  ): Promise<void> {
    await this.checkPermission(
      workspaceId,
      requesterId,
      Permission.MEMBER_REMOVE
    );

    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (workspace?.ownerId === userId) {
      throw new ForbiddenError("Cannot remove workspace owner");
    }

    await this.workspaceRepository.removeMember(workspaceId, userId);

    await this.activityLogRepository.create({
      workspaceId,
      userId: requesterId,
      action: ActivityType.MEMBER_REMOVED,
      metadata: { removedUserId: userId },
    });

    logger.info(`Member removed from workspace: ${workspaceId}`);
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: string,
    requesterId: string
  ): Promise<WorkspaceMember> {
    await this.checkPermission(
      workspaceId,
      requesterId,
      Permission.MEMBER_UPDATE_ROLE
    );

    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (workspace?.ownerId === userId) {
      throw new ForbiddenError("Cannot change owner role");
    }

    const member = await this.workspaceRepository.updateMemberRole(
      workspaceId,
      userId,
      role as Role
    );

    await this.activityLogRepository.create({
      workspaceId,
      userId: requesterId,
      action: ActivityType.MEMBER_ROLE_CHANGED,
      metadata: { targetUserId: userId, newRole: role },
    });

    logger.info(`Member role updated in workspace: ${workspaceId}`);

    return member;
  }

  private async checkPermission(
    workspaceId: string,
    userId: string,
    permission: Permission
  ): Promise<void> {
    const role = await this.workspaceRepository.getMemberRole(
      workspaceId,
      userId
    );

    if (!role) {
      throw new ForbiddenError("You are not a member of this workspace");
    }

    if (!hasPermission(role as Role, permission)) {
      throw new ForbiddenError("You do not have permission for this action");
    }
  }
}

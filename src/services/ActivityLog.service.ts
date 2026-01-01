import { ActivityLog } from "../domain/entities/ActivityLog.entity.js";
import { type IActivityLogRepository } from "../repositories/interfaces/IActivityLogRepository.js";
import { type IWorkspaceRepository } from "../repositories/interfaces/IWorkspaceRepository.js";
import { ActivityLogRepository } from "../repositories/implementations/ActivityLog.repository.js";
import { WorkspaceRepository } from "../repositories/implementations/Workspace.repository.js";

export class ActivityLogService {
  constructor(private activityLogRepository: IActivityLogRepository) {}

  async getWorkspaceActivityLogs(
    workspaceId: string,
    userId: string,
    limit?: number
  ): Promise<ActivityLog[]> {
    // await this.checkPermission(
    //   workspaceId,
    //   userId,
    //   Permission.ACTIVITY_LOG_VIEW
    // );

    return await this.activityLogRepository.findByWorkspaceId(
      workspaceId,
      limit
    );
  }

  async getUserActivityLogs(
    userId: string,
    limit?: number
  ): Promise<ActivityLog[]> {
    return await this.activityLogRepository.findByUserId(userId, limit);
  }

  //   private async checkPermission(
  //     workspaceId: string,
  //     userId: string,
  //     permission: Permission
  //   ): Promise<void> {
  //     const role = await this.workspaceRepository.getMemberRole(
  //       workspaceId,
  //       userId
  //     );

  //     if (!role) {
  //       throw new ForbiddenError("You are not a member of this workspace");
  //     }

  //     if (!hasPermission(role as Role, permission)) {
  //       throw new ForbiddenError("You do not have permission for this action");
  //     }
  //   }
}

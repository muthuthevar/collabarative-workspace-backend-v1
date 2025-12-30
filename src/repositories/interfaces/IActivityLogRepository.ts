import { ActivityLog } from "../../domain/entities/ActivityLog.entity.js";
import { ActivityType } from "../../domain/enums/ActivityType.enum.js";

export interface CreateActivityLogDto {
  workspaceId: string;
  userId: string;
  action: ActivityType;
  metadata?: object;
}

export interface IActivityLogRepository {
  create(data: CreateActivityLogDto): Promise<ActivityLog>;
  findByWorkspaceId(
    workspaceId: string,
    limit?: number
  ): Promise<ActivityLog[]>;
  findByUserId(userId: string, limit?: number): Promise<ActivityLog[]>;
}

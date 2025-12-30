import { prisma } from "../../config/prisma.config.js";
import { ActivityLog } from "../../domain/entities/ActivityLog.entity.js";
import type {
  IActivityLogRepository,
  CreateActivityLogDto,
} from "../interfaces/IActivityLogRepository.js";

export class ActivityLogRepository implements IActivityLogRepository {
  async create(data: CreateActivityLogDto): Promise<ActivityLog> {
    const log = await prisma.activityLog.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        action: data.action,
        metadata: data.metadata || {},
      },
    });
    return log as ActivityLog;
  }

  async findByWorkspaceId(
    workspaceId: string,
    limit = 50
  ): Promise<ActivityLog[]> {
    const logs = await prisma.activityLog.findMany({
      where: { workspaceId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    return logs as ActivityLog[];
  }

  async findByUserId(userId: string, limit = 50): Promise<ActivityLog[]> {
    const logs = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    return logs as ActivityLog[];
  }
}

import { ActivityType } from "../enums/ActivityType.enum.js";

export class ActivityLog {
  readonly id: string;
  readonly workspaceId: string;
  readonly userId: string;
  readonly action: ActivityType;
  readonly metadata: object;
  readonly timestamp: Date;

  constructor(data: ActivityLog) {
    this.id = data.id;
    this.workspaceId = data.workspaceId;
    this.userId = data.userId;
    this.action = data.action;
    this.metadata = data.metadata;
    this.timestamp = data.timestamp;
  }
}

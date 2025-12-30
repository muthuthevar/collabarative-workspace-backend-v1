export class WorkspaceMember {
  readonly workspaceId: string;
  readonly userId: string;
  role: string;
  readonly joinedAt: Date;

  constructor(data: WorkspaceMember) {
    this.workspaceId = data.workspaceId;
    this.userId = data.userId;
    this.role = data.role;
    this.joinedAt = data.joinedAt;
  }
}

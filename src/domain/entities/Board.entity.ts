export class Board {
  readonly id: string;
  readonly workspaceId: string;
  title: string;
  content: object;
  readonly createdBy: string;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(data: Board) {
    this.id = data.id;
    this.workspaceId = data.workspaceId;
    this.title = data.title;
    this.content = data.content;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

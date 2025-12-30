export class Workspace {
  readonly id: string;
  name: string;
  readonly ownerId: string;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(data: Workspace) {
    this.id = data.id;
    this.name = data.name;
    this.ownerId = data.ownerId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

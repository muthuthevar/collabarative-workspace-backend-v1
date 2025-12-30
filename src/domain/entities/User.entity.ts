export class User {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  name: string;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(data: User) {
    this.id = data.id;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.name = data.name;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

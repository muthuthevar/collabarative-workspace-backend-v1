import type { User } from "../../domain/entities/User.entity.js";

export type CreateUserDto = {
  email: string;
  passwordHash: string;
  name: string;
};

export type UpdateUserDto = {
  email?: string;
  passwordHash?: string;
  name?: string;
};

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
  update(data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
  exists(email: string): Promise<boolean>;
}

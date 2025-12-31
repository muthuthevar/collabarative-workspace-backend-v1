import { prisma } from "../../config/prisma.config.js";
import type { User } from "../../domain/entities/User.entity.js";
import type {
  CreateUserDto,
  IUserRepository,
  UpdateUserDto,
} from "../interfaces/IUserRepository.js";

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { email } });
  }

  async create(data: CreateUserDto): Promise<User> {
    return await prisma.user.create({ data });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    return await prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  async exists(email: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  }
}

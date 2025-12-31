import { User } from "../domain/entities/User.entity.js";
import { type IUserRepository } from "../repositories/interfaces/IUserRepository.js";
import { UserRepository } from "../repositories/implementations/User.repository.js";
import { PasswordUtil } from "../utils/password.util.js";
import { JwtUtil } from "../utils/jwt.util.js";
import {
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export interface RegisterUserDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, "passwordHash">;
  accessToken: string;
  refreshToken: string;
}

export class UserService {
  private userRepository: IUserRepository;

  constructor(userRepository?: IUserRepository) {
    this.userRepository = userRepository || new UserRepository();
  }

  async register(data: RegisterUserDto): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    const passwordHash = await PasswordUtil.hash(data.password);

    const user = await this.userRepository.create({
      email: data.email,
      passwordHash,
      name: data.name,
    });

    logger.info(`User registered: ${user.id}`);

    const accessToken = JwtUtil.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = JwtUtil.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isPasswordValid = await PasswordUtil.compare(
      data.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    logger.info(`User logged in: ${user.id}`);

    const accessToken = JwtUtil.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = JwtUtil.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    const payload = JwtUtil.verifyRefreshToken(token);

    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    const accessToken = JwtUtil.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    return { accessToken };
  }

  async getUserById(id: string): Promise<Omit<User, "passwordHash">> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(
    id: string,
    data: { name?: string; email?: string }
  ): Promise<Omit<User, "passwordHash">> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictError("Email already in use");
      }
    }

    const updatedUser = await this.userRepository.update(id, data);

    logger.info(`User updated: ${id}`);

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    await this.userRepository.delete(id);
    logger.info(`User deleted: ${id}`);
  }
}

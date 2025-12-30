import { prisma } from "../../config/prisma.config.js";
import { Workspace } from "../../domain/entities/Workspace.entity.js";
import { WorkspaceMember } from "../../domain/entities/WorkspaceMember.entity.js";
import { Role } from "../../domain/enums/Role.enum.js";
import type {
  IWorkspaceRepository,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  AddMemberDto,
  WorkspaceWithMembers,
} from "../interfaces/IWorkspaceRepository.js";

export class WorkspaceRepository implements IWorkspaceRepository {
  async findById(id: string): Promise<Workspace | null> {
    return await prisma.workspace.findUnique({ where: { id } });
  }

  async findByIdWithMembers(id: string): Promise<WorkspaceWithMembers | null> {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!workspace) return null;

    return workspace as WorkspaceWithMembers;
  }

  async findByOwnerId(ownerId: string): Promise<Workspace[]> {
    return await prisma.workspace.findMany({ where: { ownerId } });
  }

  async findByUserId(userId: string): Promise<Workspace[]> {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
    });
    return memberships.map((m) => m.workspace);
  }

  async create(data: CreateWorkspaceDto): Promise<Workspace> {
    return await prisma.workspace.create({
      data: {
        name: data.name,
        ownerId: data.ownerId,
        members: {
          create: {
            userId: data.ownerId,
            role: "OWNER",
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateWorkspaceDto): Promise<Workspace> {
    return await prisma.workspace.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.workspace.delete({ where: { id } });
  }

  async addMember(data: AddMemberDto): Promise<WorkspaceMember> {
    return await prisma.workspaceMember.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        role: data.role,
      },
    });
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: Role
  ): Promise<WorkspaceMember> {
    return await prisma.workspaceMember.update({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      data: { role },
    });
  }

  async getMemberRole(
    workspaceId: string,
    userId: string
  ): Promise<Role | null> {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
    return member ? (member.role as Role) : null;
  }

  async isMember(workspaceId: string, userId: string): Promise<boolean> {
    const count = await prisma.workspaceMember.count({
      where: { workspaceId, userId },
    });
    return count > 0;
  }
}

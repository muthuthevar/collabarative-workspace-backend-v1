import { Workspace } from "../../domain/entities/Workspace.entity.js";
import type { WorkspaceMember } from "../../domain/entities/WorkspaceMember.entity.js";
import type { Role } from "../../domain/enums/Role.enum.js";

export type CreateWorkspaceDto = {
  name: string;
  ownerId: string;
};

export type UpdateWorkspaceDto = {
  name?: string;
};

export interface WorkspaceWithMembers extends Workspace {
  members: WorkspaceMember[];
}

export type AddMemberDto = {
  workspaceId: string;
  userId: string;
  role: Role;
};

export interface IWorkspaceRepository {
  findById(id: string): Promise<Workspace | null>;
  findByIdWithMembers(id: string): Promise<WorkspaceWithMembers | null>;
  findByOwnerId(ownerId: string): Promise<Workspace[]>;
  findByUserId(userId: string): Promise<Workspace[]>;
  create(data: CreateWorkspaceDto): Promise<Workspace>;
  update(id: string, data: UpdateWorkspaceDto): Promise<Workspace>;
  delete(id: string): Promise<void>;
  addMember(data: AddMemberDto): Promise<WorkspaceMember>;
  removeMember(workspaceId: string, userId: string): Promise<void>;
  updateMemberRole(
    workspaceId: string,
    userId: string,
    role: Role
  ): Promise<WorkspaceMember>;
  getMemberRole(workspaceId: string, userId: string): Promise<Role | null>;
  isMember(workspaceId: string, userId: string): Promise<boolean>;
}

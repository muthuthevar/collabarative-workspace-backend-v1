import { Role } from "./Role.enum.js";

export enum Permission {
  WORKSPACE_READ = "WORKSPACE_READ",
  WORKSPACE_UPDATE = "WORKSPACE_UPDATE",
  WORKSPACE_DELETE = "WORKSPACE_DELETE",
  MEMBER_INVITE = "MEMBER_INVITE",
  MEMBER_REMOVE = "MEMBER_REMOVE",
  MEMBER_UPDATE_ROLE = "MEMBER_UPDATE_ROLE",
  BOARD_CREATE = "BOARD_CREATE",
  BOARD_READ = "BOARD_READ",
  BOARD_UPDATE = "BOARD_UPDATE",
  BOARD_DELETE = "BOARD_DELETE",
}

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    Permission.WORKSPACE_READ,
    Permission.WORKSPACE_UPDATE,
    Permission.WORKSPACE_DELETE,
    Permission.MEMBER_INVITE,
    Permission.MEMBER_REMOVE,
    Permission.MEMBER_UPDATE_ROLE,
    Permission.BOARD_CREATE,
    Permission.BOARD_READ,
    Permission.BOARD_UPDATE,
    Permission.BOARD_DELETE,
  ],
  [Role.ADMIN]: [
    Permission.WORKSPACE_READ,
    Permission.WORKSPACE_UPDATE,
    Permission.MEMBER_INVITE,
    Permission.MEMBER_REMOVE,
    Permission.BOARD_CREATE,
    Permission.BOARD_READ,
    Permission.BOARD_UPDATE,
    Permission.BOARD_DELETE,
  ],
  [Role.MEMBER]: [
    Permission.WORKSPACE_READ,
    Permission.BOARD_CREATE,
    Permission.BOARD_READ,
    Permission.BOARD_UPDATE,
  ],
  [Role.VIEWER]: [Permission.WORKSPACE_READ, Permission.BOARD_READ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return RolePermissions[role].includes(permission);
}

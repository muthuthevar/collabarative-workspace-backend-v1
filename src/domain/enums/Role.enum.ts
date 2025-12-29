export enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

export const RoleHierarchy: Record<Role, number> = {
  [Role.OWNER]: 4,
  [Role.ADMIN]: 3,
  [Role.MEMBER]: 2,
  [Role.VIEWER]: 1,
};

export function hasHigherRole(role1: Role, role2: Role): boolean {
  return RoleHierarchy[role1] > RoleHierarchy[role2];
}

export function hasEqualOrHigherRole(role1: Role, role2: Role): boolean {
  return RoleHierarchy[role1] >= RoleHierarchy[role2];
}

import { Role } from './user.interface';

// Re-export Role for convenience
export { Role };

export enum Permission {
  // Task permissions
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',

  // User management permissions
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Organization permissions
  ORG_CREATE = 'org:create',
  ORG_READ = 'org:read',
  ORG_UPDATE = 'org:update',
  ORG_DELETE = 'org:delete',

  // Audit permissions
  AUDIT_READ = 'audit:read',
}

// Role-based permission mapping with inheritance
// Owner > Admin > Viewer
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.VIEWER]: [
    Permission.TASK_READ,
    Permission.USER_READ,
    Permission.ORG_READ,
  ],
  [Role.ADMIN]: [
    // Inherits Viewer permissions
    Permission.TASK_READ,
    Permission.USER_READ,
    Permission.ORG_READ,
    // Additional Admin permissions
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.AUDIT_READ,
  ],
  [Role.OWNER]: [
    // All permissions
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.ORG_CREATE,
    Permission.ORG_READ,
    Permission.ORG_UPDATE,
    Permission.ORG_DELETE,
    Permission.AUDIT_READ,
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRoleHierarchy(role: Role): Role[] {
  switch (role) {
    case Role.OWNER:
      return [Role.OWNER, Role.ADMIN, Role.VIEWER];
    case Role.ADMIN:
      return [Role.ADMIN, Role.VIEWER];
    case Role.VIEWER:
      return [Role.VIEWER];
    default:
      return [];
  }
}

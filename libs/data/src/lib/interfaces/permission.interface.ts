import { Role } from './user.interface';

// Re-export Role for convenience - allows importing both from this file
export { Role };

/**
 * Permission Enum - Defines all granular permissions in the system
 *
 * Naming Convention: RESOURCE_ACTION (e.g., TASK_CREATE)
 * String Format: 'resource:action' (e.g., 'task:create')
 *
 * These permissions are mapped to roles in ROLE_PERMISSIONS below.
 * Guards check these permissions to authorize specific actions.
 */
export enum Permission {
  // ═══════════════════════════════════════════════════════════
  // TASK PERMISSIONS - Control access to task operations
  // ═══════════════════════════════════════════════════════════
  TASK_CREATE = 'task:create', // Create new tasks (Admin, Owner)
  TASK_READ = 'task:read', // View tasks (All roles)
  TASK_UPDATE = 'task:update', // Edit existing tasks (Admin, Owner)
  TASK_DELETE = 'task:delete', // Delete tasks (Admin, Owner)

  // ═══════════════════════════════════════════════════════════
  // USER MANAGEMENT PERMISSIONS - Control team member operations
  // ═══════════════════════════════════════════════════════════
  USER_CREATE = 'user:create', // Add new team members (Admin, Owner)
  USER_READ = 'user:read', // View team members (All roles)
  USER_UPDATE = 'user:update', // Edit user details/roles (Admin, Owner)
  USER_DELETE = 'user:delete', // Remove team members (Owner only)

  // ═══════════════════════════════════════════════════════════
  // ORGANIZATION PERMISSIONS - Control organization operations
  // ═══════════════════════════════════════════════════════════
  ORG_CREATE = 'org:create', // Create child organizations (Owner only)
  ORG_READ = 'org:read', // View organization info (All roles)
  ORG_UPDATE = 'org:update', // Edit organization details (Owner only)
  ORG_DELETE = 'org:delete', // Delete organization (Owner only)

  // ═══════════════════════════════════════════════════════════
  // AUDIT PERMISSIONS - Control access to audit logs
  // ═══════════════════════════════════════════════════════════
  AUDIT_READ = 'audit:read', // View audit logs (Admin, Owner)
}

/**
 * ROLE_PERMISSIONS - The core RBAC mapping table
 *
 * This is where the magic happens! Each role maps to an array of permissions.
 * When a guard checks if a user can perform an action, it looks up the user's
 * role in this table and checks if the required permission is in the array.
 *
 * Role Hierarchy: OWNER > ADMIN > VIEWER
 * - Each higher role explicitly includes all lower role permissions
 * - This is intentional for clarity and easy auditing
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  /**
   * VIEWER Role - Read-only access
   * Can only view data, cannot create, edit, or delete anything
   */
  [Role.VIEWER]: [
    Permission.TASK_READ, // Can view tasks in their organization
    Permission.USER_READ, // Can see team members
    Permission.ORG_READ, // Can see organization info
  ],

  /**
   * ADMIN Role - Task & User management
   * Inherits all VIEWER permissions plus create/edit capabilities
   * Cannot delete users or manage organizations
   */
  [Role.ADMIN]: [
    // ─── Inherited from VIEWER ───
    Permission.TASK_READ,
    Permission.USER_READ,
    Permission.ORG_READ,
    // ─── Additional ADMIN permissions ───
    Permission.TASK_CREATE, // Can create new tasks
    Permission.TASK_UPDATE, // Can edit tasks
    Permission.TASK_DELETE, // Can delete tasks
    Permission.USER_CREATE, // Can add new team members
    Permission.USER_UPDATE, // Can edit user details (but not delete)
    Permission.AUDIT_READ, // Can view audit logs for compliance
  ],

  /**
   * OWNER Role - Full system access
   * Has ALL permissions including destructive operations
   * Only role that can delete users and manage organization settings
   */
  [Role.OWNER]: [
    // ─── All Task permissions ───
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    // ─── All User permissions (including DELETE) ───
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE, // ⚠️ OWNER ONLY - can remove team members
    // ─── All Organization permissions ───
    Permission.ORG_CREATE, // ⚠️ OWNER ONLY - can create child orgs
    Permission.ORG_READ,
    Permission.ORG_UPDATE, // ⚠️ OWNER ONLY - can edit org settings
    Permission.ORG_DELETE, // ⚠️ OWNER ONLY - can delete organization
    // ─── Audit permissions ───
    Permission.AUDIT_READ,
  ],
};

/**
 * hasPermission - Check if a role has a specific permission
 *
 * @param role - The user's role (owner, admin, viewer)
 * @param permission - The permission to check (e.g., Permission.TASK_CREATE)
 * @returns boolean - true if the role has the permission
 *
 * @example
 * hasPermission(Role.VIEWER, Permission.TASK_CREATE)  // false
 * hasPermission(Role.ADMIN, Permission.TASK_CREATE)   // true
 * hasPermission(Role.OWNER, Permission.USER_DELETE)   // true
 *
 * Used by: PermissionsGuard to authorize requests
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * getRoleHierarchy - Get all roles a user can "act as" based on their role
 *
 * This enables role inheritance:
 * - An OWNER can access routes requiring ADMIN or VIEWER
 * - An ADMIN can access routes requiring VIEWER
 * - A VIEWER can only access VIEWER routes
 *
 * @param role - The user's actual role
 * @returns Role[] - Array of roles the user can satisfy
 *
 * @example
 * getRoleHierarchy(Role.OWNER)  // [OWNER, ADMIN, VIEWER]
 * getRoleHierarchy(Role.ADMIN)  // [ADMIN, VIEWER]
 * getRoleHierarchy(Role.VIEWER) // [VIEWER]
 *
 * Used by: RolesGuard to check if user meets role requirements
 */
export function getRoleHierarchy(role: Role): Role[] {
  switch (role) {
    case Role.OWNER:
      return [Role.OWNER, Role.ADMIN, Role.VIEWER]; // Can act as any role
    case Role.ADMIN:
      return [Role.ADMIN, Role.VIEWER]; // Can act as Admin or Viewer
    case Role.VIEWER:
      return [Role.VIEWER]; // Can only act as Viewer
    default:
      return []; // Unknown role gets no access
  }
}

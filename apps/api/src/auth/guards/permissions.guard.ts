import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, hasPermission } from '@task-management/data';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { User } from '../../entities';

/**
 * PermissionsGuard - Fine-Grained Authorization Guard
 *
 * This guard checks if the authenticated user has specific permissions
 * to access a route. Unlike RolesGuard, it checks granular permissions
 * (e.g., TASK_CREATE) rather than broad roles (e.g., ADMIN).
 *
 * Usage:
 * ```typescript
 * @UseGuards(PermissionsGuard)
 * @RequirePermissions(Permission.TASK_CREATE, Permission.TASK_UPDATE)
 * async createOrUpdateTask() { ... }
 * ```
 *
 * Key Difference from RolesGuard:
 * - RolesGuard: Checks if user HAS a role (with hierarchy)
 * - PermissionsGuard: Checks if user's role INCLUDES specific permissions
 *
 * Permission Resolution:
 * User Role → ROLE_PERMISSIONS mapping → Check if permission exists
 *
 * Note: User must have ALL required permissions (AND logic, not OR)
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  /**
   * Reflector reads metadata set by decorators
   */
  constructor(private reflector: Reflector) {}

  /**
   * canActivate - Main authorization logic
   *
   * @param context - ExecutionContext containing request details
   * @returns boolean - true if authorized, throws ForbiddenException if not
   */
  canActivate(context: ExecutionContext): boolean {
    // ═══════════════════════════════════════════════════════════
    // Step 1: Get required permissions from @RequirePermissions() decorator
    // ═══════════════════════════════════════════════════════════
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // ═══════════════════════════════════════════════════════════
    // Step 2: If no permissions specified, allow access
    // ═══════════════════════════════════════════════════════════
    // Routes without @RequirePermissions() are accessible to any authenticated user
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // ═══════════════════════════════════════════════════════════
    // Step 3: Get authenticated user from request
    // ═══════════════════════════════════════════════════════════
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // ═══════════════════════════════════════════════════════════
    // Step 4: Check if user has ALL required permissions
    // ═══════════════════════════════════════════════════════════
    // Uses .every() - user needs ALL permissions, not just one
    // Example: @RequirePermissions(TASK_CREATE, TASK_READ)
    //          User must have BOTH permissions to access
    //
    // hasPermission() looks up user.role in ROLE_PERMISSIONS table:
    //   hasPermission('viewer', TASK_CREATE) → false (not in viewer's list)
    //   hasPermission('admin', TASK_CREATE)  → true (in admin's list)
    const hasAllPermissions = requiredPermissions.every((permission) =>
      hasPermission(user.role, permission)
    );

    // ═══════════════════════════════════════════════════════════
    // Step 5: Deny access if missing any permission
    // ═══════════════════════════════════════════════════════════
    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Access denied. Required permissions: ${requiredPermissions.join(', ')}`
      );
    }

    // ═══════════════════════════════════════════════════════════
    // Step 6: Allow access
    // ═══════════════════════════════════════════════════════════
    return true;
  }
}

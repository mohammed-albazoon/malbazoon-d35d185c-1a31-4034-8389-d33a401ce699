import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, getRoleHierarchy } from '@task-management/data';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from '../../entities';

/**
 * RolesGuard - Authorization Guard for Role-Based Access Control
 *
 * This guard checks if the authenticated user has one of the required roles
 * to access a route. It supports role hierarchy (Owner > Admin > Viewer).
 *
 * Usage:
 * ```typescript
 * @UseGuards(RolesGuard)
 * @Roles(Role.OWNER, Role.ADMIN)  // Only Owner and Admin can access
 * async sensitiveOperation() { ... }
 * ```
 *
 * Key Feature: Role Hierarchy
 * - An OWNER can access routes requiring ADMIN or VIEWER
 * - An ADMIN can access routes requiring VIEWER
 * - This is handled by getRoleHierarchy() function
 *
 * Note: This guard must run AFTER JwtAuthGuard to have access to request.user
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * Reflector is used to read metadata set by decorators
   * It's injected by NestJS dependency injection
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
    // Step 1: Get required roles from @Roles() decorator
    // ═══════════════════════════════════════════════════════════
    // getAllAndOverride checks both method and class level decorators
    // Method-level takes precedence over class-level
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(), // Check method first: @Roles() on specific endpoint
      context.getClass(), // Then check class: @Roles() on controller
    ]);

    // ═══════════════════════════════════════════════════════════
    // Step 2: If no roles specified, allow access
    // ═══════════════════════════════════════════════════════════
    // Routes without @Roles() decorator are accessible to any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // ═══════════════════════════════════════════════════════════
    // Step 3: Get authenticated user from request
    // ═══════════════════════════════════════════════════════════
    // User was attached by JwtAuthGuard after validating the JWT token
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    // This shouldn't happen if JwtAuthGuard runs first, but safety check
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // ═══════════════════════════════════════════════════════════
    // Step 4: Get user's role hierarchy
    // ═══════════════════════════════════════════════════════════
    // Example: If user.role is OWNER, userRoles = [OWNER, ADMIN, VIEWER]
    // This means Owner can satisfy requirements for Admin or Viewer roles
    const userRoles = getRoleHierarchy(user.role);

    // ═══════════════════════════════════════════════════════════
    // Step 5: Check if user satisfies any required role
    // ═══════════════════════════════════════════════════════════
    // Uses .some() - user needs at least ONE of the required roles
    // Example: @Roles(Role.OWNER, Role.ADMIN) - user needs Owner OR Admin
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    // ═══════════════════════════════════════════════════════════
    // Step 6: Deny access if no matching role
    // ═══════════════════════════════════════════════════════════
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    // ═══════════════════════════════════════════════════════════
    // Step 7: Allow access
    // ═══════════════════════════════════════════════════════════
    return true;
  }
}

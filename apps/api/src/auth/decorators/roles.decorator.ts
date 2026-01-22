import { SetMetadata } from '@nestjs/common';
import { Role } from '@task-management/data';

/**
 * Metadata key used to store required roles
 * RolesGuard checks for this key to determine access
 */
export const ROLES_KEY = 'roles';

/**
 * @Roles() Decorator - Specifies which roles can access a route
 *
 * When applied to a controller method or class, RolesGuard will check
 * if the authenticated user has one of the specified roles.
 *
 * Usage:
 * ```typescript
 * @UseGuards(RolesGuard)
 * @Roles(Role.OWNER, Role.ADMIN)  // Only Owner OR Admin can access
 * @Get('audit-log')
 * async getAuditLog() { ... }
 * ```
 *
 * How it works:
 * 1. SetMetadata attaches { roles: [Role.OWNER, Role.ADMIN] } to route metadata
 * 2. RolesGuard reads this using Reflector
 * 3. Guard checks if user's role (with hierarchy) matches any required role
 *
 * Role Hierarchy:
 * - @Roles(Role.VIEWER) → Owner, Admin, AND Viewer can access
 * - @Roles(Role.ADMIN)  → Only Owner and Admin can access
 * - @Roles(Role.OWNER)  → Only Owner can access
 *
 * @param roles - One or more Role enum values
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

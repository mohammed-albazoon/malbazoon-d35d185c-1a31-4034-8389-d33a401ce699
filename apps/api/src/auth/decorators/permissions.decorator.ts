import { SetMetadata } from '@nestjs/common';
import { Permission } from '@task-management/data';

/**
 * Metadata key used to store required permissions
 * PermissionsGuard checks for this key to determine access
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * @RequirePermissions() Decorator - Specifies which permissions are needed
 *
 * When applied to a controller method or class, PermissionsGuard will check
 * if the authenticated user's role includes ALL the specified permissions.
 *
 * Usage:
 * ```typescript
 * @UseGuards(PermissionsGuard)
 * @RequirePermissions(Permission.TASK_CREATE)
 * @Post()
 * async createTask(@Body() dto: CreateTaskDto) { ... }
 * ```
 *
 * How it works:
 * 1. SetMetadata attaches { permissions: [Permission.TASK_CREATE] } to metadata
 * 2. PermissionsGuard reads this using Reflector
 * 3. Guard looks up user's role in ROLE_PERMISSIONS mapping
 * 4. Checks if ALL required permissions exist in that role's permission array
 *
 * Important: Uses AND logic (not OR)
 * - @RequirePermissions(TASK_CREATE, TASK_DELETE)
 * - User must have BOTH permissions to access
 *
 * Permission → Role Mapping:
 * - TASK_CREATE → Admin, Owner (not Viewer)
 * - USER_DELETE → Owner only
 * - TASK_READ   → All roles
 *
 * @param permissions - One or more Permission enum values
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

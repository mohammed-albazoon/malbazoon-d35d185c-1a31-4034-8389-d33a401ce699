import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../entities';

/**
 * @CurrentUser() Decorator - Injects the authenticated user into controller methods
 *
 * This is a parameter decorator that extracts the user from the request object.
 * The user is attached to the request by JwtAuthGuard after validating the JWT.
 *
 * Usage:
 * ```typescript
 * @Get('profile')
 * async getProfile(@CurrentUser() user: User) {
 *   return user;  // Returns the full user object
 * }
 *
 * @Get('my-org')
 * async getMyOrg(@CurrentUser('organizationId') orgId: string) {
 *   return orgId;  // Returns just the organizationId property
 * }
 * ```
 *
 * How it works:
 * 1. JwtAuthGuard validates JWT and attaches user to request.user
 * 2. This decorator extracts request.user using ExecutionContext
 * 3. If a property name is passed (e.g., 'organizationId'), returns that property
 * 4. Otherwise, returns the entire User object
 *
 * @param data - Optional: specific property of User to extract
 * @returns User object or specific property value
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | any => {
    // Get the HTTP request from the execution context
    const request = ctx.switchToHttp().getRequest();

    // Extract user attached by JwtAuthGuard
    const user = request.user as User;

    // If no user (shouldn't happen after JwtAuthGuard), return null
    if (!user) {
      return null;
    }

    // If specific property requested, return just that property
    // Otherwise, return the entire user object
    return data ? user[data] : user;
  }
);

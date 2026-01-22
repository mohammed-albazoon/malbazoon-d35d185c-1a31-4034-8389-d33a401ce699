import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

/**
 * JwtAuthGuard - Global Authentication Guard
 *
 * This guard runs on EVERY request to the API (registered globally in AppModule).
 * It validates the JWT token from the Authorization header and attaches the
 * authenticated user to the request object.
 *
 * Flow:
 * 1. Check if route is marked with @Public() decorator
 * 2. If public, skip authentication and allow request
 * 3. If not public, validate JWT token using Passport's JWT strategy
 * 4. If valid, attach user to request.user
 * 5. If invalid/missing, throw 401 Unauthorized
 *
 * Registration (in app.module.ts):
 * ```
 * providers: [
 *   { provide: APP_GUARD, useClass: JwtAuthGuard }
 * ]
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * canActivate - Determines if the request should proceed
   *
   * @param context - ExecutionContext containing request info
   * @returns boolean | Promise<boolean> - true to allow, false to deny
   */
  canActivate(context: ExecutionContext) {
    // ─── Step 1: Check for @Public() decorator ───
    // Reflector reads metadata set by decorators
    // getAllAndOverride checks both method-level and class-level decorators
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Method-level decorator (e.g., @Public() on login method)
      context.getClass(), // Class-level decorator (e.g., @Public() on entire controller)
    ]);

    // ─── Step 2: Skip auth for public routes ───
    // Public routes: /auth/login, /auth/register
    if (isPublic) {
      return true; // Allow without checking JWT
    }

    // ─── Step 3: Validate JWT for protected routes ───
    // Delegates to Passport's AuthGuard which:
    // 1. Extracts token from "Authorization: Bearer <token>"
    // 2. Verifies signature using JWT_SECRET
    // 3. Checks expiration
    // 4. Calls JwtStrategy.validate() to attach user
    return super.canActivate(context);
  }

  /**
   * handleRequest - Custom error handling for authentication failures
   *
   * Called after Passport validates (or fails to validate) the JWT.
   * Allows us to customize the error message.
   *
   * @param err - Error from Passport (if any)
   * @param user - Validated user object (if successful)
   * @param info - Additional info from Passport
   * @returns The user object if valid
   * @throws UnauthorizedException if authentication fails
   */
  handleRequest<TUser = any>(err: any, user: TUser, _info: any): TUser {
    // If there's an error or no user, authentication failed
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    // Return user - will be attached to request.user
    return user;
  }
}

import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to mark routes as public
 * JwtAuthGuard checks for this key to skip authentication
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() Decorator - Marks a route as publicly accessible
 *
 * When applied to a controller method or class, JwtAuthGuard will skip
 * JWT token validation, allowing unauthenticated access.
 *
 * Usage:
 * ```typescript
 * @Public()
 * @Post('login')
 * async login(@Body() loginDto: LoginDto) {
 *   // No JWT required - anyone can access
 * }
 * ```
 *
 * How it works:
 * 1. SetMetadata attaches { isPublic: true } to the route's metadata
 * 2. JwtAuthGuard uses Reflector to read this metadata
 * 3. If isPublic is true, guard returns true without validating JWT
 *
 * Used on: /auth/login, /auth/register
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

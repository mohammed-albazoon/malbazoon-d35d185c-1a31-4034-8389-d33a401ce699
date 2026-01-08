import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from '../roles.guard';
import { Role } from '@task-management/data';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createMockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('when no roles are required', () => {
    it('should return true when no roles decorator is set', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockExecutionContext({ role: Role.VIEWER });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when roles array is empty', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const context = createMockExecutionContext({ role: Role.VIEWER });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('when user is not authenticated', () => {
    it('should throw ForbiddenException when user is null', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER]);

      const context = createMockExecutionContext(null);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('User not authenticated');
    });

    it('should throw ForbiddenException when user is undefined', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER]);

      const context = createMockExecutionContext(undefined);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('role hierarchy - OWNER', () => {
    const ownerUser = { id: 'user-1', role: Role.OWNER, organizationId: 'org-1' };

    it('should allow access when OWNER role is required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);

      const context = createMockExecutionContext(ownerUser);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when ADMIN role is required (owner inherits admin)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const context = createMockExecutionContext(ownerUser);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when VIEWER role is required (owner inherits viewer)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER]);

      const context = createMockExecutionContext(ownerUser);
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('role hierarchy - ADMIN', () => {
    const adminUser = { id: 'user-1', role: Role.ADMIN, organizationId: 'org-1' };

    it('should deny access when OWNER role is required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);

      const context = createMockExecutionContext(adminUser);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Access denied');
    });

    it('should allow access when ADMIN role is required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const context = createMockExecutionContext(adminUser);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when VIEWER role is required (admin inherits viewer)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER]);

      const context = createMockExecutionContext(adminUser);
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('role hierarchy - VIEWER', () => {
    const viewerUser = { id: 'user-1', role: Role.VIEWER, organizationId: 'org-1' };

    it('should deny access when OWNER role is required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER]);

      const context = createMockExecutionContext(viewerUser);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny access when ADMIN role is required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const context = createMockExecutionContext(viewerUser);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow access when VIEWER role is required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER]);

      const context = createMockExecutionContext(viewerUser);
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('multiple roles required (OR logic)', () => {
    it('should allow access when user has any of the required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER, Role.ADMIN]);

      const adminUser = { role: Role.ADMIN };
      const context = createMockExecutionContext(adminUser);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when owner accesses admin/viewer route', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, Role.VIEWER]);

      const ownerUser = { role: Role.OWNER };
      const context = createMockExecutionContext(ownerUser);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access when user has none of the required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER, Role.ADMIN]);

      const viewerUser = { role: Role.VIEWER };
      const context = createMockExecutionContext(viewerUser);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should include required roles in error message', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.OWNER, Role.ADMIN]);

      const viewerUser = { role: Role.VIEWER };
      const context = createMockExecutionContext(viewerUser);

      try {
        guard.canActivate(context);
        fail('Expected ForbiddenException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('owner');
        expect(error.message).toContain('admin');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle user with undefined role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER]);

      const userWithNoRole = { id: 'user-1' };
      const context = createMockExecutionContext(userWithNoRole);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should handle user with invalid role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER]);

      const userWithInvalidRole = { id: 'user-1', role: 'invalid-role' };
      const context = createMockExecutionContext(userWithInvalidRole);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});

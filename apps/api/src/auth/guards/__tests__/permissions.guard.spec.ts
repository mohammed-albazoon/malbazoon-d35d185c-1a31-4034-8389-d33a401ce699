import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsGuard } from '../permissions.guard';
import { Permission, Role } from '@task-management/data';
import { PERMISSIONS_KEY } from '../../decorators/permissions.decorator';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
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
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('when no permissions are required', () => {
    it('should return true when no permissions decorator is set', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockExecutionContext({ role: Role.VIEWER });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when permissions array is empty', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const context = createMockExecutionContext({ role: Role.VIEWER });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('when user is not authenticated', () => {
    it('should throw ForbiddenException when user is null', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.TASK_READ]);

      const context = createMockExecutionContext(null);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('User not authenticated');
    });

    it('should throw ForbiddenException when user is undefined', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.TASK_READ]);

      const context = createMockExecutionContext(undefined);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('VIEWER role permissions', () => {
    const viewerUser = { id: 'user-1', role: Role.VIEWER, organizationId: 'org-1' };

    it('should allow TASK_READ permission for viewer', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.TASK_READ]);

      const context = createMockExecutionContext(viewerUser);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow USER_READ permission for viewer', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.USER_READ]);

      const context = createMockExecutionContext(viewerUser);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow ORG_READ permission for viewer', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.ORG_READ]);

      const context = createMockExecutionContext(viewerUser);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny TASK_CREATE permission for viewer', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.TASK_CREATE]);

      const context = createMockExecutionContext(viewerUser);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Access denied');
    });

    it('should deny TASK_UPDATE permission for viewer', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.TASK_UPDATE]);

      const context = createMockExecutionContext(viewerUser);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny TASK_DELETE permission for viewer', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.TASK_DELETE]);

      const context = createMockExecutionContext(viewerUser);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny AUDIT_READ permission for viewer', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.AUDIT_READ]);

      const context = createMockExecutionContext(viewerUser);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('ADMIN role permissions', () => {
    const adminUser = { id: 'user-1', role: Role.ADMIN, organizationId: 'org-1' };

    it('should allow TASK_CREATE permission for admin', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.TASK_CREATE]);

      const context = createMockExecutionContext(adminUser);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow TASK_READ permission for admin', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.TASK_READ]);

      const context = createMockExecutionContext(adminUser);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow TASK_UPDATE permission for admin', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.TASK_UPDATE]);

      const context = createMockExecutionContext(adminUser);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow TASK_DELETE permission for admin', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.TASK_DELETE]);

      const context = createMockExecutionContext(adminUser);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow USER_CREATE permission for admin', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.USER_CREATE]);

      const context = createMockExecutionContext(adminUser);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow AUDIT_READ permission for admin', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.AUDIT_READ]);

      const context = createMockExecutionContext(adminUser);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny USER_DELETE permission for admin', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.USER_DELETE]);

      const context = createMockExecutionContext(adminUser);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny ORG_CREATE permission for admin', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.ORG_CREATE]);

      const context = createMockExecutionContext(adminUser);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny ORG_DELETE permission for admin', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.ORG_DELETE]);

      const context = createMockExecutionContext(adminUser);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('OWNER role permissions', () => {
    const ownerUser = { id: 'user-1', role: Role.OWNER, organizationId: 'org-1' };

    it('should allow all task permissions for owner', () => {
      const taskPermissions = [
        Permission.TASK_CREATE,
        Permission.TASK_READ,
        Permission.TASK_UPDATE,
        Permission.TASK_DELETE,
      ];

      for (const permission of taskPermissions) {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([permission]);
        const context = createMockExecutionContext(ownerUser);
        expect(guard.canActivate(context)).toBe(true);
      }
    });

    it('should allow all user permissions for owner', () => {
      const userPermissions = [
        Permission.USER_CREATE,
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.USER_DELETE,
      ];

      for (const permission of userPermissions) {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([permission]);
        const context = createMockExecutionContext(ownerUser);
        expect(guard.canActivate(context)).toBe(true);
      }
    });

    it('should allow all org permissions for owner', () => {
      const orgPermissions = [
        Permission.ORG_CREATE,
        Permission.ORG_READ,
        Permission.ORG_UPDATE,
        Permission.ORG_DELETE,
      ];

      for (const permission of orgPermissions) {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([permission]);
        const context = createMockExecutionContext(ownerUser);
        expect(guard.canActivate(context)).toBe(true);
      }
    });

    it('should allow AUDIT_READ permission for owner', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.AUDIT_READ]);

      const context = createMockExecutionContext(ownerUser);
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('multiple permissions required', () => {
    it('should allow when user has all required permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Permission.TASK_READ,
        Permission.TASK_CREATE,
      ]);

      const context = createMockExecutionContext({ role: Role.ADMIN });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny when user is missing any required permission', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Permission.TASK_READ,
        Permission.USER_DELETE, // Admin doesn't have this
      ]);

      const context = createMockExecutionContext({ role: Role.ADMIN });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should include missing permissions in error message', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Permission.TASK_CREATE,
        Permission.USER_DELETE,
      ]);

      const context = createMockExecutionContext({ role: Role.VIEWER });

      try {
        guard.canActivate(context);
        fail('Expected ForbiddenException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('task:create');
        expect(error.message).toContain('user:delete');
      }
    });
  });
});

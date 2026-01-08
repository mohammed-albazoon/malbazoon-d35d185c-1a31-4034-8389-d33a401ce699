import { hasPermission, getRoleHierarchy, Permission, Role, ROLE_PERMISSIONS } from '../interfaces/permission.interface';

describe('Permission System', () => {
  describe('hasPermission', () => {
    it('should return true for owner with any permission', () => {
      expect(hasPermission(Role.OWNER, Permission.TASK_CREATE)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.TASK_DELETE)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.USER_DELETE)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.ORG_DELETE)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.AUDIT_READ)).toBe(true);
    });

    it('should return true for admin with allowed permissions', () => {
      expect(hasPermission(Role.ADMIN, Permission.TASK_CREATE)).toBe(true);
      expect(hasPermission(Role.ADMIN, Permission.TASK_UPDATE)).toBe(true);
      expect(hasPermission(Role.ADMIN, Permission.TASK_DELETE)).toBe(true);
      expect(hasPermission(Role.ADMIN, Permission.AUDIT_READ)).toBe(true);
    });

    it('should return false for admin with restricted permissions', () => {
      expect(hasPermission(Role.ADMIN, Permission.USER_DELETE)).toBe(false);
      expect(hasPermission(Role.ADMIN, Permission.ORG_DELETE)).toBe(false);
      expect(hasPermission(Role.ADMIN, Permission.ORG_CREATE)).toBe(false);
    });

    it('should return true for viewer with read-only permissions', () => {
      expect(hasPermission(Role.VIEWER, Permission.TASK_READ)).toBe(true);
      expect(hasPermission(Role.VIEWER, Permission.USER_READ)).toBe(true);
      expect(hasPermission(Role.VIEWER, Permission.ORG_READ)).toBe(true);
    });

    it('should return false for viewer with write permissions', () => {
      expect(hasPermission(Role.VIEWER, Permission.TASK_CREATE)).toBe(false);
      expect(hasPermission(Role.VIEWER, Permission.TASK_UPDATE)).toBe(false);
      expect(hasPermission(Role.VIEWER, Permission.TASK_DELETE)).toBe(false);
      expect(hasPermission(Role.VIEWER, Permission.AUDIT_READ)).toBe(false);
    });
  });

  describe('getRoleHierarchy', () => {
    it('should return full hierarchy for owner', () => {
      const hierarchy = getRoleHierarchy(Role.OWNER);
      expect(hierarchy).toContain(Role.OWNER);
      expect(hierarchy).toContain(Role.ADMIN);
      expect(hierarchy).toContain(Role.VIEWER);
      expect(hierarchy).toHaveLength(3);
    });

    it('should return admin and viewer for admin role', () => {
      const hierarchy = getRoleHierarchy(Role.ADMIN);
      expect(hierarchy).toContain(Role.ADMIN);
      expect(hierarchy).toContain(Role.VIEWER);
      expect(hierarchy).not.toContain(Role.OWNER);
      expect(hierarchy).toHaveLength(2);
    });

    it('should return only viewer for viewer role', () => {
      const hierarchy = getRoleHierarchy(Role.VIEWER);
      expect(hierarchy).toContain(Role.VIEWER);
      expect(hierarchy).not.toContain(Role.ADMIN);
      expect(hierarchy).not.toContain(Role.OWNER);
      expect(hierarchy).toHaveLength(1);
    });
  });

  describe('ROLE_PERMISSIONS mapping', () => {
    it('should have correct permissions count for each role', () => {
      expect(ROLE_PERMISSIONS[Role.VIEWER].length).toBe(3);
      expect(ROLE_PERMISSIONS[Role.ADMIN].length).toBeGreaterThan(ROLE_PERMISSIONS[Role.VIEWER].length);
      expect(ROLE_PERMISSIONS[Role.OWNER].length).toBeGreaterThan(ROLE_PERMISSIONS[Role.ADMIN].length);
    });

    it('owner should have all permissions', () => {
      const allPermissions = Object.values(Permission);
      allPermissions.forEach(permission => {
        expect(ROLE_PERMISSIONS[Role.OWNER]).toContain(permission);
      });
    });
  });
});

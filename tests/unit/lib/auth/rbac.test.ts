import { describe, it, expect } from 'vitest';
import { hasPermission, requirePermission, isAdmin } from '@/lib/auth/rbac';
import { ForbiddenError } from '@/lib/errors';
import type { Permission } from '@/lib/types';

describe('RBAC', () => {
  describe('hasPermission', () => {
    const adminPermissions: Permission[] = [
      'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
      'tasks:read_all', 'users:manage', 'pipeline:view',
    ];

    const userPermissions: Permission[] = [
      'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
    ];

    it.each(adminPermissions)('admin has %s permission', (permission) => {
      expect(hasPermission('admin', permission)).toBe(true);
    });

    it.each(userPermissions)('user has %s permission', (permission) => {
      expect(hasPermission('user', permission)).toBe(true);
    });

    it('user does not have tasks:read_all', () => {
      expect(hasPermission('user', 'tasks:read_all')).toBe(false);
    });

    it('user does not have users:manage', () => {
      expect(hasPermission('user', 'users:manage')).toBe(false);
    });

    it('user does not have pipeline:view', () => {
      expect(hasPermission('user', 'pipeline:view')).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('does not throw for valid permission', () => {
      expect(() => requirePermission('admin', 'users:manage')).not.toThrow();
    });

    it('throws ForbiddenError for missing permission', () => {
      expect(() => requirePermission('user', 'users:manage')).toThrow(ForbiddenError);
    });
  });

  describe('isAdmin', () => {
    it('returns true for admin', () => {
      expect(isAdmin('admin')).toBe(true);
    });

    it('returns false for user', () => {
      expect(isAdmin('user')).toBe(false);
    });
  });
});

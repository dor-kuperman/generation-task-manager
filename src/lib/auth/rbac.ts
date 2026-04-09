import type { UserRole, Permission } from '../types';
import { ForbiddenError } from '../errors';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
    'tasks:read_all', 'users:manage', 'pipeline:view',
  ],
  user: [
    'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError('Access denied');
  }
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

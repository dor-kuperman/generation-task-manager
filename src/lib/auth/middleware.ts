import { NextRequest } from 'next/server';
import { verifySession } from './session';
import { UnauthorizedError } from '../errors';
import type { JWTPayload, UserRole, Permission } from '../types';
import { requirePermission } from './rbac';

export interface AuthenticatedRequest {
  userId: string;
  userRole: UserRole;
  userEmail: string;
}

export async function authenticate(request: NextRequest): Promise<AuthenticatedRequest> {
  const cookie = request.cookies.get('session');
  if (!cookie?.value) {
    throw new UnauthorizedError();
  }

  let payload: JWTPayload;
  try {
    payload = await verifySession(cookie.value);
  } catch {
    throw new UnauthorizedError('Invalid session');
  }

  return {
    userId: payload.sub,
    userRole: payload.role,
    userEmail: payload.email,
  };
}

export async function authenticateWithPermission(
  request: NextRequest,
  permission: Permission,
): Promise<AuthenticatedRequest> {
  const auth = await authenticate(request);
  requirePermission(auth.userRole, permission);
  return auth;
}

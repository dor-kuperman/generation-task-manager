import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithPermission } from '@/lib/auth/middleware';
import { listUsers } from '@/lib/db/queries/users';
import { handleError } from '@/lib/errors';
import { withLogging } from '@/lib/api/with-logging';

export const GET = withLogging(async (request: NextRequest) => {
  try {
    await authenticateWithPermission(request, 'users:manage');
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return handleError(error);
  }
});

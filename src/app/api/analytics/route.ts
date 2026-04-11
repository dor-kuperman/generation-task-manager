import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithPermission } from '@/lib/auth/middleware';
import { isAdmin } from '@/lib/auth/rbac';
import { getAnalytics } from '@/lib/es/queries';
import { handleError } from '@/lib/errors';
import { withLogging } from '@/lib/api/with-logging';

export const GET = withLogging(async (request: NextRequest) => {
  try {
    const auth = await authenticateWithPermission(request, 'tasks:read');
    const aggregations = await getAnalytics(auth.userId, isAdmin(auth.userRole));
    return NextResponse.json({ aggregations });
  } catch (error) {
    return handleError(error);
  }
});

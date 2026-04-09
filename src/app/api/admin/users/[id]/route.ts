import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { authenticateWithPermission } from '@/lib/auth/middleware';
import { updateUserRole } from '@/lib/db/queries/users';
import { handleError, NotFoundError, ValidationError } from '@/lib/errors';

type RouteParams = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  role: z.enum(['admin', 'user']),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await authenticateWithPermission(request, 'users:manage');
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((i) => i.message).join(', '));
    }

    const user = await updateUserRole(id, parsed.data.role);
    if (!user) throw new NotFoundError('User');

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error);
  }
}

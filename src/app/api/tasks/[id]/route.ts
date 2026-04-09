import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { authenticateWithPermission } from '@/lib/auth/middleware';
import { isAdmin } from '@/lib/auth/rbac';
import { getTaskById, updateTask, deleteTask, canAccessTask } from '@/lib/db/queries/tasks';
import { handleError, NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateWithPermission(request, 'tasks:read');
    const { id } = await params;
    const task = await getTaskById(id);

    if (!task) throw new NotFoundError('Task');

    if (!isAdmin(auth.userRole) && !(await canAccessTask(id, auth.userId, false))) {
      throw new ForbiddenError('You do not have access to this task');
    }

    return NextResponse.json({ task });
  } catch (error) {
    return handleError(error);
  }
}

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateWithPermission(request, 'tasks:update');
    const { id } = await params;

    if (!isAdmin(auth.userRole) && !(await canAccessTask(id, auth.userId, false))) {
      throw new ForbiddenError('You do not have access to this task');
    }

    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((i) => i.message).join(', '));
    }

    const task = await updateTask(id, parsed.data);
    if (!task) throw new NotFoundError('Task');

    return NextResponse.json({ task });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateWithPermission(request, 'tasks:delete');
    const { id } = await params;

    if (!isAdmin(auth.userRole) && !(await canAccessTask(id, auth.userId, false))) {
      throw new ForbiddenError('You do not have access to this task');
    }

    const deleted = await deleteTask(id);
    if (!deleted) throw new NotFoundError('Task');

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

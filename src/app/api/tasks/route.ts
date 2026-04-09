import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { authenticateWithPermission } from '@/lib/auth/middleware';
import { isAdmin } from '@/lib/auth/rbac';
import { listTasks, createTask } from '@/lib/db/queries/tasks';
import { handleError, ValidationError } from '@/lib/errors';

const listQuerySchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateWithPermission(request, 'tasks:read');
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = listQuerySchema.safeParse(params);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((i) => i.message).join(', '));
    }

    const result = await listTasks({
      userId: auth.userId,
      isAdmin: isAdmin(auth.userRole),
      ...parsed.data,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignee_id: z.string().uuid().optional(),
  due_date: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateWithPermission(request, 'tasks:create');
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((i) => i.message).join(', '));
    }

    const task = await createTask({ ...parsed.data, created_by: auth.userId });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

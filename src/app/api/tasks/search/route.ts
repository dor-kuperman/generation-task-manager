import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { authenticateWithPermission } from '@/lib/auth/middleware';
import { isAdmin } from '@/lib/auth/rbac';
import { searchTasks } from '@/lib/es/queries';
import { handleError, ValidationError } from '@/lib/errors';
import { withLogging } from '@/lib/api/with-logging';
import type { TaskStatus, TaskPriority } from '@/lib/types';

const searchParamsSchema = z.object({
  q: z.string().max(500).default(''),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignee_id: z.uuid().optional(),
  tags: z.string().optional(),
  from: z.coerce.number().int().min(0).max(10000).default(0),
  size: z.coerce.number().int().min(1).max(100).default(20),
});

export const GET = withLogging(async (request: NextRequest) => {
  try {
    const auth = await authenticateWithPermission(request, 'tasks:read');
    const params = request.nextUrl.searchParams;

    const parsed = searchParamsSchema.safeParse({
      q: params.get('q') ?? undefined,
      status: params.get('status') || undefined,
      priority: params.get('priority') || undefined,
      assignee_id: params.get('assignee_id') || undefined,
      tags: params.get('tags') || undefined,
      from: params.get('from') ?? undefined,
      size: params.get('size') ?? undefined,
    });

    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((i) => i.message).join(', '));
    }

    const { q, status, priority, assignee_id, tags, from, size } = parsed.data;

    const result = await searchTasks({
      query: q,
      status: status as TaskStatus | undefined,
      priority: priority as TaskPriority | undefined,
      assignee_id,
      tags: tags?.split(',').filter(Boolean),
      from,
      size,
      userId: auth.userId,
      isAdmin: isAdmin(auth.userRole),
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/middleware', () => ({
  authenticateWithPermission: vi.fn(),
}));

vi.mock('@/lib/db/queries/tasks', () => ({
  createTask: vi.fn(),
  listTasks: vi.fn(),
}));

import { GET, POST } from '@/app/api/tasks/route';
import { authenticateWithPermission } from '@/lib/auth/middleware';
import { createTask, listTasks } from '@/lib/db/queries/tasks';
import { UnauthorizedError } from '@/lib/errors';

const mockAuth = {
  userId: 'user-1',
  userRole: 'user' as const,
  userEmail: 'test@example.com',
};

const mockTask = {
  id: 'task-1',
  title: 'Test Task',
  description: 'A test task',
  status: 'todo' as const,
  priority: 'high' as const,
  assignee_id: null,
  created_by: 'user-1',
  due_date: null,
  tags: ['test'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('Tasks API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authenticateWithPermission).mockResolvedValue(mockAuth);
  });

  describe('POST /api/tasks', () => {
    it('creates a task and returns 201', async () => {
      vi.mocked(createTask).mockResolvedValue(mockTask);

      const req = new NextRequest(new URL('/api/tasks', 'http://localhost:3000'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Task',
          description: 'A test task',
          priority: 'high',
          tags: ['test'],
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.task.title).toBe('Test Task');
      expect(data.task.priority).toBe('high');
      expect(data.task.status).toBe('todo');
    });
  });

  describe('GET /api/tasks', () => {
    it('lists tasks and returns 200', async () => {
      vi.mocked(listTasks).mockResolvedValue({ tasks: [mockTask], total: 1 });

      const req = new NextRequest(new URL('/api/tasks', 'http://localhost:3000'));
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.tasks).toHaveLength(1);
      expect(data.total).toBe(1);
    });
  });

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(authenticateWithPermission).mockRejectedValue(new UnauthorizedError());

      const req = new NextRequest(new URL('/api/tasks', 'http://localhost:3000'));
      const res = await GET(req);

      expect(res.status).toBe(401);
    });
  });
});

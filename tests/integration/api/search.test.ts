import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/middleware', () => ({
  authenticateWithPermission: vi.fn(),
}));

vi.mock('@/lib/es/queries', () => ({
  searchTasks: vi.fn(),
}));

import { GET } from '@/app/api/tasks/search/route';
import { authenticateWithPermission } from '@/lib/auth/middleware';
import { searchTasks } from '@/lib/es/queries';
import { UnauthorizedError } from '@/lib/errors';

const mockAuth = {
  userId: 'user-1',
  userRole: 'user' as const,
  userEmail: 'test@example.com',
};

describe('Search API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authenticateWithPermission).mockResolvedValue(mockAuth);
  });

  it('searches tasks and returns 200', async () => {
    vi.mocked(searchTasks).mockResolvedValue({
      hits: [
        {
          source: {
            id: 'task-1',
            title: 'Test Task',
            description: null,
            status: 'todo',
            priority: 'medium',
            assignee_id: null,
            created_by: 'user-1',
            due_date: null,
            tags: [],
            is_overdue: false,
            days_until_due: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          score: 1.5,
          highlight: { title: ['<mark>Test</mark> Task'] },
        },
      ],
      total: 1,
    });

    const req = new NextRequest(new URL('/api/tasks/search?q=test', 'http://localhost:3000'));
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.hits).toHaveLength(1);
    expect(data.total).toBe(1);
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(authenticateWithPermission).mockRejectedValue(new UnauthorizedError());

    const req = new NextRequest(new URL('/api/tasks/search?q=test', 'http://localhost:3000'));
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});

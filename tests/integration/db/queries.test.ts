import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();

vi.mock('@/lib/db/pool', () => ({
  getPool: vi.fn(() => ({ query: mockQuery })),
}));

import { createUser, findUserByEmail } from '@/lib/db/queries/users';
import { createTask, listTasks } from '@/lib/db/queries/tasks';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockTask = {
  id: 'task-1',
  title: 'Test Task',
  description: null,
  status: 'todo',
  priority: 'medium',
  assignee_id: null,
  created_by: 'user-1',
  due_date: null,
  tags: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('Database Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('calls pool.query with correct INSERT SQL and params', async () => {
      mockQuery.mockResolvedValue({ rows: [mockUser] });

      const result = await createUser('test@example.com', 'hashed-pw', 'Test User');

      expect(mockQuery).toHaveBeenCalledOnce();
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('INSERT INTO users');
      expect(params).toEqual(['test@example.com', 'hashed-pw', 'Test User', 'user']);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findUserByEmail', () => {
    it('returns null when query returns empty rows', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await findUserByEmail('nobody@example.com');

      expect(result).toBeNull();
      expect(mockQuery).toHaveBeenCalledOnce();
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('SELECT');
      expect(sql).toContain('WHERE email = $1');
      expect(params).toEqual(['nobody@example.com']);
    });

    it('returns user when query returns a row', async () => {
      mockQuery.mockResolvedValue({ rows: [{ ...mockUser, password: 'hashed' }] });

      const result = await findUserByEmail('test@example.com');

      expect(result).toEqual({ ...mockUser, password: 'hashed' });
    });
  });

  describe('createTask', () => {
    it('passes correct params to INSERT', async () => {
      mockQuery.mockResolvedValue({ rows: [mockTask] });

      const result = await createTask({
        title: 'Test Task',
        created_by: 'user-1',
        priority: 'high',
        tags: ['test'],
      });

      expect(mockQuery).toHaveBeenCalledOnce();
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('INSERT INTO tasks');
      expect(params[0]).toBe('Test Task');       // title
      expect(params[5]).toBe('user-1');           // created_by
      expect(params[3]).toBe('high');             // priority
      expect(params[7]).toEqual(['test']);         // tags
      expect(result).toEqual(mockTask);
    });
  });

  describe('listTasks', () => {
    it('builds correct WHERE clause for non-admin user', async () => {
      mockQuery.mockResolvedValue({ rows: [{ total: '1' }] })  // count query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })     // count query (first call)
        .mockResolvedValueOnce({ rows: [mockTask] });           // data query

      // Reset to set up ordered responses
      mockQuery.mockReset();
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [mockTask] });

      const result = await listTasks({
        userId: 'user-1',
        isAdmin: false,
        status: 'todo',
      });

      expect(mockQuery).toHaveBeenCalledTimes(2);

      // Count query
      const [countSql, countParams] = mockQuery.mock.calls[0];
      expect(countSql).toContain('SELECT COUNT(*)');
      expect(countSql).toContain('created_by = $1 OR assignee_id = $1');
      expect(countSql).toContain('status = $2');
      expect(countParams).toEqual(['user-1', 'todo']);

      // Data query
      const [dataSql] = mockQuery.mock.calls[1];
      expect(dataSql).toContain('SELECT * FROM tasks');
      expect(dataSql).toContain('ORDER BY created_at DESC');

      expect(result).toEqual({ tasks: [mockTask], total: 1 });
    });

    it('skips user filter for admin', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await listTasks({
        userId: 'admin-1',
        isAdmin: true,
      });

      const [countSql] = mockQuery.mock.calls[0];
      expect(countSql).not.toContain('created_by');
      expect(result).toEqual({ tasks: [], total: 0 });
    });
  });
});

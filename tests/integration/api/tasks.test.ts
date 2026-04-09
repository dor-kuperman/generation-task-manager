import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('Tasks API', () => {
  let sessionCookie: string;

  beforeAll(async () => {
    // Register and get session
    const email = `tasks-test-${Date.now()}@example.com`;
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Task Tester', email, password: 'TestPassword1' }),
    });

    const setCookie = res.headers.get('set-cookie');
    sessionCookie = setCookie?.split(';')[0] ?? '';
  });

  it('creates a task', async () => {
    const res = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        title: 'Integration Test Task',
        description: 'Created by integration test',
        priority: 'high',
        tags: ['test'],
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.task.title).toBe('Integration Test Task');
    expect(data.task.priority).toBe('high');
    expect(data.task.status).toBe('todo');
  });

  it('lists tasks', async () => {
    const res = await fetch(`${BASE_URL}/api/tasks`, {
      headers: { Cookie: sessionCookie },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.tasks).toBeDefined();
    expect(data.total).toBeGreaterThan(0);
  });

  it('requires authentication', async () => {
    const res = await fetch(`${BASE_URL}/api/tasks`);
    expect(res.status).toBe(401);
  });
});

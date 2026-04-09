import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('Search API', () => {
  let sessionCookie: string;

  beforeAll(async () => {
    const email = `search-test-${Date.now()}@example.com`;
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Search Tester', email, password: 'TestPassword1' }),
    });

    const setCookie = res.headers.get('set-cookie');
    sessionCookie = setCookie?.split(';')[0] ?? '';
  });

  it('searches tasks via elasticsearch', async () => {
    const res = await fetch(`${BASE_URL}/api/tasks/search?q=test`, {
      headers: { Cookie: sessionCookie },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('hits');
    expect(data).toHaveProperty('total');
  });

  it('requires authentication', async () => {
    const res = await fetch(`${BASE_URL}/api/tasks/search?q=test`);
    expect(res.status).toBe(401);
  });
});

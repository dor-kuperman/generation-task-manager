import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries/users', () => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
}));

vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  verifyPassword: vi.fn(),
}));

vi.mock('@/lib/auth/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, retryAfterMs: 0 }),
}));

import { POST as registerPOST } from '@/app/api/auth/register/route';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { createUser, findUserByEmail } from '@/lib/db/queries/users';
import { verifyPassword } from '@/lib/auth/password';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

function makeRequest(url: string, body: unknown) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns 201 with session cookie', async () => {
      vi.mocked(createUser).mockResolvedValue(mockUser);

      const req = makeRequest('/api/auth/register', {
        email: 'test@example.com',
        password: 'TestPassword1',
        name: 'Test User',
      });

      const res = await registerPOST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.user.email).toBe('test@example.com');
      expect(data.user.name).toBe('Test User');
      expect(data.user.role).toBe('user');

      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toContain('session=');
    });

    it('returns 409 on duplicate email', async () => {
      vi.mocked(createUser).mockRejectedValue({ code: '23505' });

      const req = makeRequest('/api/auth/register', {
        email: 'dup@example.com',
        password: 'TestPassword1',
        name: 'Dup User',
      });

      const res = await registerPOST(req);
      expect(res.status).toBe(409);
    });

    it('returns 400 on invalid body', async () => {
      const req = makeRequest('/api/auth/register', { email: 'bad' });

      const res = await registerPOST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials and returns session cookie', async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({
        ...mockUser,
        password: 'hashed-password',
      });
      vi.mocked(verifyPassword).mockResolvedValue(true);

      const req = makeRequest('/api/auth/login', {
        email: 'test@example.com',
        password: 'TestPassword1',
      });

      const res = await loginPOST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.user.email).toBe('test@example.com');
      expect(data.user).not.toHaveProperty('password');

      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toContain('session=');
    });

    it('returns 401 on bad password', async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({
        ...mockUser,
        password: 'hashed-password',
      });
      vi.mocked(verifyPassword).mockResolvedValue(false);

      const req = makeRequest('/api/auth/login', {
        email: 'test@example.com',
        password: 'WrongPassword1',
      });

      const res = await loginPOST(req);
      expect(res.status).toBe(401);
    });
  });
});

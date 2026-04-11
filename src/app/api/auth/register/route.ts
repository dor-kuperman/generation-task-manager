import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { hashPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { createUser } from '@/lib/db/queries/users';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { handleError, ConflictError, ValidationError } from '@/lib/errors';
import { withLogging } from '@/lib/api/with-logging';

const registerSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
  name: z.string().min(1, 'Name is required').max(100),
});

export const POST = withLogging(async (request: NextRequest) => {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed, retryAfterMs } = checkRateLimit(`register:${ip}`);
    if (!allowed) {
      return NextResponse.json(
        { error: { message: 'Too many attempts. Please try again later.', code: 'RATE_LIMITED' } },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } },
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((i) => i.message).join(', '));
    }

    const { email, password, name } = parsed.data;

    const hashedPassword = await hashPassword(password);

    let user;
    try {
      user = await createUser(email, hashedPassword, name);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === '23505') {
        throw new ConflictError('Email already registered');
      }
      throw err;
    }

    const token = await createSession({ id: user.id, role: user.role, email: user.email });

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(setSessionCookie(token));
    return response;
  } catch (error) {
    return handleError(error);
  }
});

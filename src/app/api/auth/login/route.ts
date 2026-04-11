import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { findUserByEmail } from '@/lib/db/queries/users';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { handleError, UnauthorizedError, ValidationError } from '@/lib/errors';
import { withLogging } from '@/lib/api/with-logging';

// Pre-computed dummy hash to compare against when user is not found (timing attack mitigation)
const DUMMY_HASH = '$2b$12$LJ3m4ys3Lk0TSwHilHmOC.8mHngyOsEwYjnKZbG6qB3QhRbSAUbm';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const POST = withLogging(async (request: NextRequest) => {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed, retryAfterMs } = checkRateLimit(`login:${ip}`);
    if (!allowed) {
      return NextResponse.json(
        { error: { message: 'Too many attempts. Please try again later.', code: 'RATE_LIMITED' } },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } },
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((i) => i.message).join(', '));
    }

    const { email, password } = parsed.data;
    const user = await findUserByEmail(email);

    // Always run bcrypt compare to prevent timing-based email enumeration
    const isValid = await verifyPassword(password, user?.password ?? DUMMY_HASH);
    if (!user || !isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = await createSession({ id: user.id, role: user.role, email: user.email });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...safeUser } = user;
    const response = NextResponse.json({ user: safeUser });
    response.cookies.set(setSessionCookie(token));
    return response;
  } catch (error) {
    return handleError(error);
  }
});

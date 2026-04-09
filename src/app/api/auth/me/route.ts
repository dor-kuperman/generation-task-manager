import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { findUserById } from '@/lib/db/queries/users';
import { handleError, NotFoundError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    const user = await findUserById(auth.userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error);
  }
}

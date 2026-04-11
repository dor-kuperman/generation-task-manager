import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';
import { withLogging } from '@/lib/api/with-logging';

export const POST = withLogging(async () => {
  const response = NextResponse.json({ success: true });
  response.cookies.set(clearSessionCookie());
  return response;
});

import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/api';
import { SESSION_MAX_AGE_SECONDS, sessionCookieOptions, signSession } from '@/lib/session';
import { authenticate, toPublicUser } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'login');
  if (limited) return limited;

  let payload: { email?: unknown; password?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const user = await authenticate(email, password);
  if (!user) {
    // Deliberately vague so the response cannot be used to enumerate accounts.
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }

  const token = await signSession({
    sub: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  });

  const response = NextResponse.json({ user: toPublicUser(user) });
  response.cookies.set({ ...sessionCookieOptions(), value: token });
  return response;
}

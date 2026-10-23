import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/api';
import { SESSION_MAX_AGE_SECONDS, sessionCookieOptions, signSession } from '@/lib/session';
import { createUser, toPublicUser, validateCredentials } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'signup');
  if (limited) return limited;

  let payload: { email?: unknown; password?: unknown; name?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  const name = typeof payload.name === 'string' ? payload.name : '';

  const invalid = validateCredentials(email, password);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  try {
    const user = await createUser(email, password, name);
    const token = await signSession({
      sub: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    });

    const response = NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
    response.cookies.set({ ...sessionCookieOptions(), value: token });
    return response;
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 409 });
  }
}

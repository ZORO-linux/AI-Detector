import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
import { findUserById, toPublicUser } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await findUserById(session.sub);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({ user: toPublicUser(user) });
}

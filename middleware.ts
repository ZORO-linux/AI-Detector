import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

const PROTECTED_PAGES = ['/message-detector', '/photo-detector', '/video-detector'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  if (pathname.startsWith('/api/analyze')) {
    return NextResponse.json(
      { error: 'You must sign in before running a scan.', code: 'unauthorized' },
      { status: 401 },
    );
  }

  if (PROTECTED_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/message-detector/:path*', '/photo-detector/:path*', '/video-detector/:path*', '/api/analyze/:path*'],
};

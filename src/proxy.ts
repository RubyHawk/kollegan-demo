import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-me'
);

/** Paths that don't require authentication */
const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/api/auth/',
  '/api/docs',
  '/api/demo/',
  // Vapi & n8n webhooks have their own auth
  '/api/ai/',
  '/api/n8n/',
  // Next.js internals
  '/_next/',
  '/favicon',
];

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // `at` = access token JWT (15-min). `token`/`portal_token` = opaque refresh tokens (7-30 days).
  // The middleware verifies the JWT. If the JWT is expired but the refresh token exists,
  // we let the request through — the client will call /api/auth/refresh on next load.
  const at = request.cookies.get('at')?.value;
  const hasRefreshToken = !!(
    request.cookies.get('token')?.value ??
    request.cookies.get('portal_token')?.value
  );

  if (!at && !hasRefreshToken) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (at) {
    try {
      await jwtVerify(at, SECRET_KEY, { algorithms: ['HS256'] });
      return NextResponse.next(); // valid JWT — allow
    } catch {
      // JWT expired or invalid. If a refresh token exists the client can recover.
      if (hasRefreshToken) return NextResponse.next();
      const loginUrl = new URL('/login', request.url);
      if (pathname !== '/') loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // No access token but refresh token present — allow through for client-side refresh.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

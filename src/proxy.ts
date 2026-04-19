import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-me'
);

/** Paths that don't require authentication */
const PUBLIC_PREFIXES = [
  '/logga-in',
  '/registrera',
  '/api/auth/',
  '/api/docs',
  '/api/demo/',
  // Vapi & n8n webhooks have their own auth
  '/api/ai/',
  '/api/n8n/',
  // Public offer signing (no account required)
  '/offerter/publik/',
  '/api/offers/public/',
  // Next.js internals
  '/_next/',
  '/favicon',
];

/** Known app routes on the offert subdomain that must NOT be treated as offer tokens */
const APP_ROUTES = [
  '/', '/admin', '/analytics', '/announcements', '/companies', '/crm',
  '/demos', '/installningar', '/logga-in', '/mallar', '/meetings',
  '/messages', '/offerter', '/produkter', '/projects', '/projekt',
  '/registrera', '/reports', '/api/', '/_next/', '/favicon',
];

const OFFER_SUBDOMAIN = process.env.PUBLIC_OFFER_SUBDOMAIN ?? 'offert';
const PUBLIC_OFFER_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const host = request.headers.get('host') ?? '';
  const hostname = host.split(':')[0];

  // Subdomain routing: offert.soleria.se/<token> → /offers/public/<token>
  // Only rewrite bare single-segment paths that are NOT known app routes.
  if (hostname.startsWith(`${OFFER_SUBDOMAIN}.`)) {
    const { pathname } = request.nextUrl;
    const isAppRoute = APP_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'));
    if (!isAppRoute) {
      const token = pathname.slice(1);
      if (token && !token.includes('/') && PUBLIC_OFFER_TOKEN_PATTERN.test(token)) {
        return NextResponse.rewrite(new URL(`/offerter/publik/${token}`, request.url));
      }
    }
    return NextResponse.next();
  }

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
    const loginUrl = new URL('/logga-in', request.url);
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
      const loginUrl = new URL('/logga-in', request.url);
      if (pathname !== '/') loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // No access token but refresh token present — allow through for client-side refresh.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)).*)'],
};

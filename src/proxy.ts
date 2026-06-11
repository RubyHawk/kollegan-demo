import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-me'
);

/** Paths that don't require authentication */
const PUBLIC_PREFIXES = [
  '/logga-in',
  '/registrera',
  '/site',
  '/api/auth/',
  '/api/v1/auth/',
  '/api/v1/public-site',
  '/api/v1/public-site/',
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

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => {
    if (prefix.endsWith('/')) return pathname.startsWith(prefix);
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

/** Known app routes on the offert subdomain that must NOT be treated as offer tokens */
const APP_ROUTES = [
  '/', '/admin', '/analytics', '/announcements', '/companies', '/crm',
  '/demos', '/installningar', '/logga-in', '/mallar', '/meetings',
  '/messages', '/offerter', '/produkter', '/projects', '/projekt',
  '/registrera', '/reports', '/api/', '/_next/', '/favicon',
];

const OFFER_SUBDOMAIN = process.env.PUBLIC_OFFER_SUBDOMAIN ?? 'offert';
const PUBLIC_SITE_HOSTS = (process.env.PUBLIC_SITE_HOSTS ?? 'restaurantdomain.se')
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);
const OFFER_HOSTS = (process.env.PUBLIC_OFFER_HOSTS ?? `offert.soleria.se,${OFFER_SUBDOMAIN}.soleria.se`)
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);
const PUBLIC_OFFER_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const host = request.headers.get('host') ?? '';
  const hostname = host.split(':')[0]?.toLowerCase() ?? '';

  if (PUBLIC_SITE_HOSTS.includes(hostname)) {
    const { pathname } = request.nextUrl;
    if (!pathname.startsWith('/site') && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
      return NextResponse.rewrite(new URL(`/site${pathname === '/' ? '' : pathname}`, request.url));
    }
  }

  // Subdomain routing: offert.soleria.se/<token> → /offers/public/<token>
  // Only rewrite bare single-segment paths that are NOT known app routes.
  if (OFFER_HOSTS.includes(hostname) || hostname.startsWith(`${OFFER_SUBDOMAIN}.`)) {
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

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // `at` = access token JWT (2 hours). `token`/`portal_token` = opaque refresh tokens (7-30 days).
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

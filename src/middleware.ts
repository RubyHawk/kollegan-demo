import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-me');
const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? 'demo';

// Routes that require authentication
const PROTECTED_PATHS = ['/dashboard', '/api/rooms', '/api/ai', '/api/activities', '/api/amenities', '/api/restaurants', '/api/hotel-info', '/api/calendar', '/api/staff', '/api/demo', '/api/n8n'];

// Routes always publicly accessible
const PUBLIC_PATHS = ['/api/sse', '/api/docs', '/login', '/auth'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Always pass through public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Inject organization ID header for downstream handlers
  const response = NextResponse.next();

  // Try to extract org ID from JWT token
  const token = req.cookies.get('auth-token')?.value
    ?? req.headers.get('authorization')?.replace('Bearer ', '');

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY, { algorithms: ['HS256'] });
      const orgId = (payload.orgId as string | undefined) ?? DEMO_ORG_ID;
      response.headers.set('x-organization-id', orgId);
      response.headers.set('x-user-id', (payload.sub as string | undefined) ?? '');
      response.headers.set('x-user-role', (payload.role as string | undefined) ?? '');
    } catch {
      // Token invalid — for protected paths, redirect to login
      if (isProtectedPath(pathname) && !pathname.startsWith('/api/')) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      // For API protected routes, inject demo org ID (demo mode fallback)
      response.headers.set('x-organization-id', DEMO_ORG_ID);
    }
  } else {
    // No token — use demo org ID
    response.headers.set('x-organization-id', DEMO_ORG_ID);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public asset files (.png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

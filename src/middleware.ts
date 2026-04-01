import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Subdomain routing middleware.
 *
 * When a request arrives at the public offer subdomain (e.g. offert.soleria.se),
 * rewrite the root path /<token> to /offers/public/<token> internally —
 * the browser URL stays clean (offert.soleria.se/<token>).
 */

const OFFER_SUBDOMAIN = process.env.PUBLIC_OFFER_SUBDOMAIN ?? 'offert';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const hostname = host.split(':')[0]; // strip port in dev

  // Check if request is on the public offer subdomain
  const isOfferSubdomain =
    hostname.startsWith(`${OFFER_SUBDOMAIN}.`) ||
    hostname === (process.env.PUBLIC_OFFER_BASE_URL ?? '').replace(/^https?:\/\//, '');

  if (isOfferSubdomain) {
    const { pathname } = req.nextUrl;

    // Already rewritten — avoid loop
    if (pathname.startsWith('/offers/public')) {
      return NextResponse.next();
    }

    // Root → redirect to a friendly landing (optional)
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // /<token> → /offers/public/<token>
    const token = pathname.slice(1); // strip leading /
    if (token && !token.includes('/')) {
      return NextResponse.rewrite(new URL(`/offers/public/${token}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

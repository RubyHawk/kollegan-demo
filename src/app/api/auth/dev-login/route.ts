/**
 * GET /api/auth/dev-login
 *
 * Development-only: issues a signed JWT and sets the `at` cookie so all
 * jwt-protected routes are accessible without a database or real login.
 *
 * Only available when NODE_ENV !== 'production'. Returns 404 in production.
 */

import { NextRequest, NextResponse } from 'next/server';
import { signAccessToken } from '@platform/auth/jwt';

const ACCESS_TTL_SEC = 60 * 60 * 24; // 24 h — convenient for dev sessions

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }

  const { token } = await signAccessToken({
    sub:      'dev-user-01',
    orgId:    'dev-org-01',
    userType: 'staff',
    roles:    ['admin'],
    aud:      'internal',
  });

  const redirect = req.nextUrl.searchParams.get('redirect') ?? '/';
  const res = NextResponse.redirect(new URL(redirect, req.url));

  res.cookies.set('at', token, {
    httpOnly: true,
    secure:   false,
    sameSite: 'lax',
    maxAge:   ACCESS_TTL_SEC,
    path:     '/',
  });

  return res;
}

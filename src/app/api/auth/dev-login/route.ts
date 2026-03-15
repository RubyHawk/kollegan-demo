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
import { prisma } from '@platform/database/prisma';

const ACCESS_TTL_SEC = 60 * 60 * 24; // 24 h — convenient for dev sessions

const DEV_ORG_ID  = 'dev-org-01';
const DEV_USER_ID = 'dev-user-01';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }

  // Ensure dev org + user exist so FK constraints are satisfied.
  await prisma.organization.upsert({
    where:  { id: DEV_ORG_ID },
    update: {},
    create: { id: DEV_ORG_ID, name: 'Dev Organization', slug: 'dev-org', plan: 'demo', orgType: 'internal' },
  });

  const { token } = await signAccessToken({
    sub:      DEV_USER_ID,
    orgId:    DEV_ORG_ID,
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

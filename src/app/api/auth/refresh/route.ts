/**
 * POST /api/auth/refresh
 *
 * Rotates the opaque refresh token and issues a new short-lived access token.
 *
 * Phase 2 changes:
 *   - Refresh token is now a 32-byte opaque value (not a JWT).
 *   - Session lookup is by SHA-256 hash. No JWT verification on the cookie.
 *   - refreshTokens() returns userId/userType for audit logging.
 *
 * Flow:
 *   1. Read raw opaque token from httpOnly cookie
 *   2. Hash + look up session in DB
 *   3. Rotate: revoke old session, issue new opaque token + new access token
 *   4. Write new refresh token back to httpOnly cookie
 *   5. Return { data: { accessToken } } in body for SPA/API client use
 *
 * Rate limit: 60/min per IP — generous since browser clients call this on every cold load.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { refreshTokens } from '@modules/supporting/auth';
import { log, AUDIT_ACTIONS } from '@modules/supporting/audit';

export const dynamic = 'force-dynamic';

const REFRESH_TTL_SEC_STAFF    = 60 * 60 * 24 * 7;
const REFRESH_TTL_SEC_CUSTOMER = 60 * 60 * 24 * 30;
const ACCESS_TTL_SEC           = 60 * 15;

export async function POST(req: NextRequest) {
  // ── Rate limiting ─────────────────────────────────────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const rl = await checkRateLimit(`refresh:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/rate-limit', title: 'Too Many Requests', status: 429 },
      { status: 429, headers: { 'Content-Type': 'application/problem+json', 'Retry-After': String(retryAfter) } }
    );
  }

  // ── Read opaque refresh token from httpOnly cookie ────────────────────────────
  const rawRefreshToken =
    req.cookies.get('token')?.value ??
    req.cookies.get('portal_token')?.value;

  if (!rawRefreshToken) {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'No refresh token present' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json', 'WWW-Authenticate': 'Bearer realm="api.kollegan.ai", charset="UTF-8"' } }
    );
  }

  // ── Rotate tokens ─────────────────────────────────────────────────────────────
  let result: Awaited<ReturnType<typeof refreshTokens>>;
  try {
    result = await refreshTokens(rawRefreshToken);
  } catch {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'Invalid or expired refresh token' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json', 'WWW-Authenticate': 'Bearer realm="api.kollegan.ai", charset="UTF-8"' } }
    );
  }

  // ── Audit ─────────────────────────────────────────────────────────────────────
  await log({
    action: AUDIT_ACTIONS.USER_TOKEN_REFRESHED,
    organizationId: result.orgId,
    actorId: result.userId,
    actorType: 'user',
    resourceType: 'User',
    resourceId: result.userId,
    metadata: { ip: ip !== 'unknown' ? ip : null },
  }).catch(() => {});

  // ── Set rotated refresh token cookie + return access token ────────────────────
  const isCustomer = result.userType === 'customer';
  const cookieName = isCustomer ? 'portal_token' : 'token';
  const ttlSec     = isCustomer ? REFRESH_TTL_SEC_CUSTOMER : REFRESH_TTL_SEC_STAFF;

  const res = NextResponse.json({ data: { accessToken: result.accessToken } });

  const sharedCookieOpts = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path:     '/',
  };

  res.cookies.set(cookieName, result.refreshToken, { ...sharedCookieOpts, maxAge: ttlSec });
  res.cookies.set('at', result.accessToken, { ...sharedCookieOpts, maxAge: ACCESS_TTL_SEC });

  return res;
}

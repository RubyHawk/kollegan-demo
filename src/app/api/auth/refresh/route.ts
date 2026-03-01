/**
 * POST /api/auth/refresh
 *
 * Rotates the refresh token and issues a new short-lived access token.
 *
 * Flow:
 *   1. Read refresh token from httpOnly cookie (staff: 'token', customer: 'portal_token')
 *   2. Verify signature, check Redis blacklist, check DB session (in refreshTokens())
 *   3. Rotate: revoke old refresh JTI, issue new refresh token + new access token
 *   4. Write new refresh token back to httpOnly cookie
 *   5. Return { data: { accessToken } } in response body for SPA/API client use
 *
 * Rate limit: 60/min per IP — generous since browser clients call this on every cold load.
 *
 * SOC 2 / GDPR: every successful rotation is written to aud_audit_logs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { refreshTokens } from '@modules/supporting/auth';
import { log, AUDIT_ACTIONS } from '@modules/supporting/audit';
import { verifyToken } from '@core/auth/jwt';

export const dynamic = 'force-dynamic';

const REFRESH_TTL_SEC_STAFF    = 60 * 60 * 24 * 7;   // 7d
const REFRESH_TTL_SEC_CUSTOMER = 60 * 60 * 24 * 30;  // 30d

export async function POST(req: NextRequest) {
  // ── Rate limiting ────────────────────────────────────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const rl = await checkRateLimit(`refresh:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/rate-limit', title: 'Too Many Requests', status: 429 },
      {
        status: 429,
        headers: {
          'Content-Type': 'application/problem+json',
          'Retry-After': String(retryAfter),
        },
      }
    );
  }

  // ── Read refresh token from httpOnly cookie ──────────────────────────────────
  const refreshTokenRaw =
    req.cookies.get('token')?.value ??
    req.cookies.get('portal_token')?.value;

  if (!refreshTokenRaw) {
    return NextResponse.json(
      {
        type: 'https://docs.kollegan.ai/problems/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'No refresh token present',
      },
      {
        status: 401,
        headers: {
          'Content-Type': 'application/problem+json',
          'WWW-Authenticate': 'Bearer realm="api.kollegan.ai", charset="UTF-8"',
        },
      }
    );
  }

  // ── Peek at the token for audit metadata before rotating ────────────────────
  // verifyToken is called again inside refreshTokens() — the redundancy is
  // intentional: we want audit metadata even if rotation fails partway through.
  let userId: string | undefined;
  let orgId: string | null = null;
  let userType: 'staff' | 'customer' = 'staff';
  try {
    const peeked = await verifyToken(refreshTokenRaw);
    userId   = peeked.sub;
    orgId    = peeked.orgId ?? null;
    userType = (peeked.userType as 'staff' | 'customer') ?? 'staff';
  } catch {
    // Token is malformed / expired — refreshTokens() will return a clean 401 below
  }

  // ── Rotate tokens ────────────────────────────────────────────────────────────
  let result: { accessToken: string; refreshToken: string };
  try {
    result = await refreshTokens(refreshTokenRaw);
  } catch {
    return NextResponse.json(
      {
        type: 'https://docs.kollegan.ai/problems/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'Invalid or expired refresh token',
      },
      {
        status: 401,
        headers: {
          'Content-Type': 'application/problem+json',
          'WWW-Authenticate': 'Bearer realm="api.kollegan.ai", charset="UTF-8"',
        },
      }
    );
  }

  // ── Audit ────────────────────────────────────────────────────────────────────
  if (userId) {
    await log({
      action: AUDIT_ACTIONS.USER_TOKEN_REFRESHED,
      organizationId: orgId,
      actorId: userId,
      actorType: 'user',
      resourceType: 'User',
      resourceId: userId,
      metadata: { ip: ip !== 'unknown' ? ip : null },
    }).catch(() => {}); // non-critical — do not fail the request on audit failure
  }

  // ── Set rotated refresh token cookie + return access token ──────────────────
  const isCustomer = userType === 'customer';
  const cookieName = isCustomer ? 'portal_token' : 'token';
  const ttlSec     = isCustomer ? REFRESH_TTL_SEC_CUSTOMER : REFRESH_TTL_SEC_STAFF;

  const res = NextResponse.json({ data: { accessToken: result.accessToken } });

  res.cookies.set(cookieName, result.refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   ttlSec,
    path:     '/',
  });

  return res;
}

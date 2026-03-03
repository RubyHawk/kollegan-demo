/**
 * POST /api/auth/mfa/verify
 *
 * Step 2 of login: verify a TOTP code (or backup code) using the mfa_challenge cookie
 * set in step 1. On success, issues opaque refresh + access tokens and clears the challenge.
 *
 * Rate limit: 10 attempts per 5 minutes per IP (prevent TOTP brute force).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { verifyMfaChallengeToken } from '@core/auth/jwt';
import { verifyTotpCode, consumeBackupCode, completeMfaLogin } from '@modules/supporting/auth';
import { log, AUDIT_ACTIONS } from '@modules/supporting/audit';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  code: z.string().min(1).max(20),
});

const REFRESH_TTL_SEC_STAFF    = 60 * 60 * 24 * 7;
const REFRESH_TTL_SEC_CUSTOMER = 60 * 60 * 24 * 30;
const ACCESS_TTL_SEC           = 60 * 15;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';

  const rl = await checkRateLimit(`mfa:${ip}`, 10, 5 * 60_000);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/rate-limit', title: 'Too Many Requests', status: 429 },
      { status: 429, headers: { 'Content-Type': 'application/problem+json', 'Retry-After': String(retryAfter) } }
    );
  }

  // Validate the MFA challenge cookie
  const challengeToken = req.cookies.get('mfa_challenge')?.value;
  if (!challengeToken) {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'MFA challenge not found or expired' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  let userId: string;
  try {
    ({ userId } = await verifyMfaChallengeToken(challengeToken));
  } catch {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'MFA challenge expired' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/bad-request', title: 'Bad Request', status: 400 },
      { status: 400, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/bad-request', title: 'Bad Request', status: 400, detail: 'code is required' },
      { status: 400, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  const { code } = parsed.data;
  const userAgent = req.headers.get('user-agent') ?? undefined;
  const ipAddress = ip !== 'unknown' ? ip : undefined;

  // Try TOTP first, then backup code
  const totpValid = await verifyTotpCode(userId, code);
  const amrMethod: 'otp' | 'hwk' = 'otp';

  if (!totpValid) {
    const backupValid = await consumeBackupCode(userId, code);
    if (!backupValid) {
      await log({
        action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
        actorId: userId,
        actorType: 'user',
        resourceType: 'User',
        resourceId: userId,
        metadata: { ip: ipAddress ?? null, reason: 'INVALID_MFA_CODE' },
      }).catch(() => {});

      return NextResponse.json(
        { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'Invalid MFA code' },
        { status: 401, headers: { 'Content-Type': 'application/problem+json' } }
      );
    }
  }

  const result = await completeMfaLogin(userId, amrMethod, ipAddress, userAgent);

  await log({
    action: AUDIT_ACTIONS.USER_LOGIN,
    organizationId: result.user.orgId,
    actorId: result.user.id,
    actorType: 'user',
    resourceType: 'User',
    resourceId: result.user.id,
    metadata: { ip: ipAddress ?? null, mfaMethod: 'totp' },
  }).catch(() => {});

  const isCustomer = result.user.userType === 'customer';
  const cookieName = isCustomer ? 'portal_token' : 'token';
  const ttlSec     = isCustomer ? REFRESH_TTL_SEC_CUSTOMER : REFRESH_TTL_SEC_STAFF;

  const res = NextResponse.json({
    data: {
      user: {
        id: result.user.id,
        email: result.user.email,
        userType: result.user.userType,
        roles: result.user.roles,
      },
    },
  });

  const sharedCookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };

  res.cookies.set(cookieName, result.refreshToken, { ...sharedCookieOpts, maxAge: ttlSec });
  res.cookies.set('at', result.accessToken, { ...sharedCookieOpts, maxAge: ACCESS_TTL_SEC });

  // Clear the challenge cookie
  res.cookies.set('mfa_challenge', '', { maxAge: 0, path: '/' });

  return res;
}

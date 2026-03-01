/**
 * POST /api/auth/webauthn/authenticate/verify
 *
 * Complete passkey authentication during login step 2.
 * On success, issues opaque refresh + access tokens with amr=['pwd','hwk'].
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { verifyMfaChallengeToken } from '@core/auth/jwt';
import { completeAuthentication, completeMfaLogin } from '@modules/supporting/auth';
import { log, AUDIT_ACTIONS } from '@modules/supporting/audit';
import type { AuthenticationResponseJSON } from '@simplewebauthn/browser';

export const dynamic = 'force-dynamic';

const REFRESH_TTL_SEC_STAFF    = 60 * 60 * 24 * 7;
const REFRESH_TTL_SEC_CUSTOMER = 60 * 60 * 24 * 30;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';

  const rl = await checkRateLimit(`webauthn:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/rate-limit', title: 'Too Many Requests', status: 429 },
      { status: 429, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

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

  const userAgent = req.headers.get('user-agent') ?? undefined;
  const ipAddress = ip !== 'unknown' ? ip : undefined;

  try {
    await completeAuthentication(userId, body as AuthenticationResponseJSON);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    await log({
      action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
      actorId: userId,
      actorType: 'user',
      resourceType: 'User',
      resourceId: userId,
      metadata: { ip: ipAddress ?? null, reason: code ?? 'WEBAUTHN_FAILED' },
    }).catch(() => {});

    if (code === 'CHALLENGE_EXPIRED') {
      return NextResponse.json(
        { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'Passkey challenge expired — please start again' },
        { status: 401, headers: { 'Content-Type': 'application/problem+json' } }
      );
    }
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'Passkey verification failed' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  const result = await completeMfaLogin(userId, 'hwk', ipAddress, userAgent);

  await log({
    action: AUDIT_ACTIONS.USER_LOGIN,
    organizationId: result.user.orgId,
    actorId: result.user.id,
    actorType: 'user',
    resourceType: 'User',
    resourceId: result.user.id,
    metadata: { ip: ipAddress ?? null, mfaMethod: 'webauthn' },
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

  res.cookies.set(cookieName, result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ttlSec,
    path: '/',
  });

  res.cookies.set('mfa_challenge', '', { maxAge: 0, path: '/' });

  return res;
}

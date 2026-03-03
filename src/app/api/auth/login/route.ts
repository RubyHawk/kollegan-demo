/**
 * POST /api/auth/login
 *
 * Phase 2 two-step login:
 *   Step 1: email + password → tokens (MFA not required) OR 202 + mfa_challenge cookie (MFA required).
 *   Step 2: client verifies MFA at /api/auth/mfa/verify or /api/auth/webauthn/authenticate/verify.
 *
 * Error codes:
 *   MFA_SETUP_REQUIRED — grace period expired, user must configure MFA before logging in.
 *
 * Rate limit: 5 attempts per minute per IP (anti brute-force).
 *
 * This route intentionally does NOT use createHandler() because it needs to set
 * httpOnly cookies directly on the NextResponse.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { signMfaChallengeToken } from '@core/auth/jwt';
import { login } from '@modules/supporting/auth';
import { log, AUDIT_ACTIONS } from '@modules/supporting/audit';

export const dynamic = 'force-dynamic';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const REFRESH_TTL_SEC_STAFF    = 60 * 60 * 24 * 7;   // 7 days
const REFRESH_TTL_SEC_CUSTOMER = 60 * 60 * 24 * 30;  // 30 days
const MFA_CHALLENGE_TTL_SEC    = 60 * 5;              // 5 minutes
const ACCESS_TTL_SEC           = 60 * 15;             // 15 minutes — matches ACCESS_TTL in jwt.ts

export async function POST(req: NextRequest) {
  // ── Rate limiting ─────────────────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';

  const rl = await checkRateLimit(ip, 5, 60_000);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/rate-limit', title: 'Too Many Requests', status: 429 },
      {
        status: 429,
        headers: {
          'Content-Type': 'application/problem+json',
          'Retry-After': String(retryAfter),
          'RateLimit-Remaining': '0',
          'RateLimit-Reset': String(retryAfter),
        },
      }
    );
  }

  // ── Input validation ──────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/bad-request', title: 'Bad Request', status: 400, detail: 'Request body is not valid JSON' },
      { status: 400, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/bad-request', title: 'Bad Request', status: 400, detail: 'Invalid email or password format' },
      { status: 400, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  const { email, password } = parsed.data;
  const userAgent = req.headers.get('user-agent') ?? undefined;
  const ipAddress = ip !== 'unknown' ? ip : undefined;

  // ── Authentication ────────────────────────────────────────────────────────────
  let outcome;
  try {
    outcome = await login({ email, password, ipAddress, userAgent });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;

    await log({
      action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
      resourceType: 'User',
      resourceId: email,
      metadata: { ip: ipAddress ?? null, reason: code ?? 'unknown' },
    }).catch(() => {});

    if (code === 'INVALID_CREDENTIALS' || code === 'ACCOUNT_DISABLED') {
      return NextResponse.json(
        { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'Invalid email or password' },
        { status: 401, headers: { 'Content-Type': 'application/problem+json', 'WWW-Authenticate': 'Bearer realm="api.kollegan.ai", charset="UTF-8"' } }
      );
    }

    if (code === 'MFA_SETUP_REQUIRED') {
      // Grace period expired — user cannot log in until MFA is configured
      return NextResponse.json(
        {
          type: 'https://docs.kollegan.ai/problems/mfa-setup-required',
          title: 'MFA Setup Required',
          status: 403,
          detail: 'Your account requires MFA. Please contact your administrator or log in from a previous session to configure it.',
        },
        { status: 403, headers: { 'Content-Type': 'application/problem+json' } }
      );
    }

    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/internal', title: 'Internal Server Error', status: 500 },
      { status: 500, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  // ── MFA challenge required (step 1 complete, step 2 pending) ─────────────────
  if ('status' in outcome && outcome.status === 'mfa_required') {
    const challengeToken = await signMfaChallengeToken(outcome.userId);

    const res = NextResponse.json(
      { data: { status: 'mfa_required', methods: outcome.methods } },
      { status: 202 }
    );

    res.cookies.set('mfa_challenge', challengeToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MFA_CHALLENGE_TTL_SEC,
      path: '/',
    });

    return res;
  }

  // ── Tokens issued (MFA not required or grace period active) ──────────────────
  // TypeScript cannot narrow LoginOutcome past the early return above; assert here.
  const loginResult = outcome as import('@modules/supporting/auth').LoginResult;

  await log({
    action: AUDIT_ACTIONS.USER_LOGIN,
    organizationId: loginResult.user.orgId,
    actorId: loginResult.user.id,
    actorType: 'user',
    resourceType: 'User',
    resourceId: loginResult.user.id,
    metadata: { ip: ipAddress ?? null, mfaWarning: !!loginResult.mfaWarning },
  }).catch(() => {});

  const isCustomer = loginResult.user.userType === 'customer';
  const cookieName = isCustomer ? 'portal_token' : 'token';
  const ttlSec     = isCustomer ? REFRESH_TTL_SEC_CUSTOMER : REFRESH_TTL_SEC_STAFF;

  const res = NextResponse.json({
    data: {
      user: {
        id: loginResult.user.id,
        email: loginResult.user.email,
        userType: loginResult.user.userType,
        roles: loginResult.user.roles,
      },
      ...(loginResult.mfaWarning ? { mfaWarning: { expiresAt: loginResult.mfaWarning.expiresAt } } : {}),
    },
  });

  const sharedCookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };

  res.cookies.set(cookieName, loginResult.refreshToken, { ...sharedCookieOpts, maxAge: ttlSec });
  res.cookies.set('at', loginResult.accessToken, { ...sharedCookieOpts, maxAge: ACCESS_TTL_SEC });

  return res;
}

/**
 * Auth API handlers - colocated with the auth module.
 *
 * Handlers that use createHandler() for standard request/response flows.
 * Cookie-based flows (login, logout, refresh) remain in their route files
 * because they need direct NextResponse cookie manipulation.
 *
 * app/api/v1/auth/ routes are thin re-export wrappers that point here.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@platform/cache/rate-limiter';
import { ACCESS_TOKEN_MAX_AGE_SEC, signMfaChallengeToken, hashOpaqueToken } from '@platform/auth/jwt';
import { login, logout, refreshTokens } from '../../application/auth.service';
import type { LoginResult } from '../../application/auth.service';
import { AUTH_AUDIT_ACTIONS, recordAuthAudit } from '../../application/auth-audit.service';
import { registerStaffAccount } from '../../application/auth-registration.service';
import { sessionRepository } from '../../infrastructure/session.repository';
import { BRAND_API_REALM, BRAND_PROBLEM_BASE } from '@shared/branding';

const REFRESH_TTL_SEC_STAFF = 60 * 60 * 24 * 7;
const REFRESH_TTL_SEC_STAFF_REMEMBER = 60 * 60 * 24 * 30;
const REFRESH_TTL_SEC_CUSTOMER = 60 * 60 * 24 * 30;
const MFA_CHALLENGE_TTL_SEC = 60 * 5;
const ACCESS_TTL_SEC = ACCESS_TOKEN_MAX_AGE_SEC;

const sharedCookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

function extractIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
}

function problemJson(type: string, title: string, status: number, detail?: string, extraHeaders?: Record<string, string>) {
  return NextResponse.json(
    { type: `${BRAND_PROBLEM_BASE}/${type}`, title, status, ...(detail ? { detail } : {}) },
    { status, headers: { 'Content-Type': 'application/problem+json', ...extraHeaders } },
  );
}

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export async function handleLogin(req: NextRequest): Promise<NextResponse> {
  const ip = extractIp(req);
  const ipRl = await checkRateLimit(`login-ip:${ip}`, 120, 60_000);
  if (!ipRl.allowed) {
    const retryAfter = Math.ceil((ipRl.resetAt - Date.now()) / 1000);
    return problemJson('rate-limit', 'Too Many Requests', 429, undefined, {
      'Retry-After': String(retryAfter),
      'RateLimit-Remaining': '0',
      'RateLimit-Reset': String(retryAfter),
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problemJson('bad-request', 'Bad Request', 400, 'Request body is not valid JSON');
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return problemJson('bad-request', 'Bad Request', 400, 'Invalid email or password format');
  }

  const { email, password, rememberMe } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();
  const accountRl = await checkRateLimit(`login:${normalizedEmail}:${ip}`, 10, 60_000);
  if (!accountRl.allowed) {
    const retryAfter = Math.ceil((accountRl.resetAt - Date.now()) / 1000);
    return problemJson('rate-limit', 'Too Many Requests', 429, undefined, {
      'Retry-After': String(retryAfter),
      'RateLimit-Remaining': '0',
      'RateLimit-Reset': String(retryAfter),
    });
  }

  const userAgent = req.headers.get('user-agent') ?? undefined;
  const ipAddress = ip !== 'unknown' ? ip : undefined;

  let outcome;
  try {
    outcome = await login({ email, password, ipAddress, userAgent, rememberMe });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;

    await recordAuthAudit({
      action: AUTH_AUDIT_ACTIONS.USER_LOGIN_FAILED,
      resourceType: 'User',
      resourceId: email,
      metadata: { ip: ipAddress ?? null, reason: code ?? 'unknown' },
    }).catch(() => {});

    if (code === 'INVALID_CREDENTIALS' || code === 'ACCOUNT_DISABLED') {
      return problemJson('unauthorized', 'Unauthorized', 401, 'Invalid email or password', {
        'WWW-Authenticate': `Bearer realm="${BRAND_API_REALM}", charset="UTF-8"`,
      });
    }
    if (code === 'MFA_SETUP_REQUIRED') {
      return problemJson(
        'mfa-setup-required',
        'MFA Setup Required',
        403,
        'Tvåstegsverifiering måste aktiveras innan du kan logga in. Be en administratör återställa din MFA-åtkomst eller använd en tidigare betrodd session för att slutföra aktiveringen.',
      );
    }

    return problemJson('internal', 'Internal Server Error', 500);
  }

  if ('status' in outcome && outcome.status === 'mfa_required') {
    const challengeToken = await signMfaChallengeToken(outcome.userId, rememberMe);
    const res = NextResponse.json({ data: { status: 'mfa_required', methods: outcome.methods } }, { status: 202 });
    res.cookies.set('mfa_challenge', challengeToken, { ...sharedCookieOpts, maxAge: MFA_CHALLENGE_TTL_SEC });
    return res;
  }

  const loginResult = outcome as LoginResult;

  await recordAuthAudit({
    action: AUTH_AUDIT_ACTIONS.USER_LOGIN,
    organizationId: loginResult.user.orgId,
    actorId: loginResult.user.id,
    actorType: 'user',
    resourceType: 'User',
    resourceId: loginResult.user.id,
    metadata: { ip: ipAddress ?? null, mfaWarning: !!loginResult.mfaWarning },
  }).catch(() => {});

  const isCustomer = loginResult.user.userType === 'customer';
  const cookieName = isCustomer ? 'portal_token' : 'token';
  const ttlSec = isCustomer
    ? REFRESH_TTL_SEC_CUSTOMER
    : (rememberMe ? REFRESH_TTL_SEC_STAFF_REMEMBER : REFRESH_TTL_SEC_STAFF);

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

  res.cookies.set(cookieName, loginResult.refreshToken, { ...sharedCookieOpts, maxAge: ttlSec });
  res.cookies.set('at', loginResult.accessToken, { ...sharedCookieOpts, maxAge: ACCESS_TTL_SEC });

  return res;
}

export async function handleLogout(req: NextRequest): Promise<NextResponse> {
  const staffToken = req.cookies.get('token')?.value;
  const portalToken = req.cookies.get('portal_token')?.value;
  const rawToken = staffToken ?? portalToken;

  if (rawToken) {
    let userId: string | undefined;
    const orgId: string | null = null;
    try {
      const hash = hashOpaqueToken(rawToken);
      const session = await sessionRepository.findByTokenHash(hash);
      if (session) userId = session.userId;
    } catch {
      // Proceed to clear cookies even when session lookup fails.
    }

    await logout(rawToken);

    if (userId) {
      await recordAuthAudit({
        action: AUTH_AUDIT_ACTIONS.USER_LOGOUT,
        organizationId: orgId,
        actorId: userId,
        actorType: 'user',
        resourceType: 'User',
        resourceId: userId,
      }).catch(() => {});
    }
  }

  const res = NextResponse.json({ data: { ok: true } });
  const clearOpts = { ...sharedCookieOpts, maxAge: 0 };
  res.cookies.set('token', '', clearOpts);
  res.cookies.set('portal_token', '', clearOpts);
  res.cookies.set('at', '', clearOpts);
  res.cookies.set('mfa_challenge', '', clearOpts);

  return res;
}

export async function handleRefresh(req: NextRequest): Promise<NextResponse> {
  const ip = extractIp(req);
  const rawRefreshToken = req.cookies.get('token')?.value ?? req.cookies.get('portal_token')?.value;
  const rlKey = rawRefreshToken ? `refresh-token:${hashOpaqueToken(rawRefreshToken)}` : `refresh-ip:${ip}`;

  const rl = await checkRateLimit(rlKey, rawRefreshToken ? 300 : 60, 60_000);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return problemJson('rate-limit', 'Too Many Requests', 429, undefined, { 'Retry-After': String(retryAfter) });
  }

  if (!rawRefreshToken) {
    return problemJson('unauthorized', 'Unauthorized', 401, 'No refresh token present', {
      'WWW-Authenticate': `Bearer realm="${BRAND_API_REALM}", charset="UTF-8"`,
    });
  }

  let result: Awaited<ReturnType<typeof refreshTokens>>;
  try {
    result = await refreshTokens(rawRefreshToken);
  } catch {
    return problemJson('unauthorized', 'Unauthorized', 401, 'Invalid or expired refresh token', {
      'WWW-Authenticate': `Bearer realm="${BRAND_API_REALM}", charset="UTF-8"`,
    });
  }

  await recordAuthAudit({
    action: AUTH_AUDIT_ACTIONS.USER_TOKEN_REFRESHED,
    organizationId: result.orgId,
    actorId: result.userId,
    actorType: 'user',
    resourceType: 'User',
    resourceId: result.userId,
    metadata: { ip: ip !== 'unknown' ? ip : null },
  }).catch(() => {});

  const isCustomer = result.userType === 'customer';
  const cookieName = isCustomer ? 'portal_token' : 'token';
  const ttlSec = isCustomer ? REFRESH_TTL_SEC_CUSTOMER : REFRESH_TTL_SEC_STAFF;

  const res = NextResponse.json({ data: { accessToken: result.accessToken } });
  res.cookies.set(cookieName, result.refreshToken, { ...sharedCookieOpts, maxAge: ttlSec });
  res.cookies.set('at', result.accessToken, { ...sharedCookieOpts, maxAge: ACCESS_TTL_SEC });

  return res;
}

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(1).max(100).optional(),
});

export async function handleRegister(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email is required and password must be at least 8 characters.' }, { status: 400 });
  }

  try {
    const result = await registerStaffAccount(parsed.data);
    const res = NextResponse.json({ id: result.user.id, email: result.user.email }, { status: 201 });
    if (result.refreshToken && result.accessToken) {
      res.cookies.set('token', result.refreshToken, { ...sharedCookieOpts, maxAge: REFRESH_TTL_SEC_STAFF });
      res.cookies.set('at', result.accessToken, { ...sharedCookieOpts, maxAge: ACCESS_TTL_SEC });
    }
    return res;
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'EMAIL_EXISTS') {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Could not create account.' }, { status: 500 });
  }
}

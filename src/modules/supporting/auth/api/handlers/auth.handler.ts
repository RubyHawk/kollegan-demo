/**
 * Auth API handlers — colocated with the auth module.
 *
 * Handlers that use createHandler() for standard request/response flows.
 * Cookie-based flows (login, logout, refresh) remain in their route files
 * because they need direct NextResponse cookie manipulation.
 *
 * app/api/ routes are thin re-export wrappers that point here.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '@platform/cache/rate-limiter';
import { signMfaChallengeToken, hashOpaqueToken } from '@platform/auth/jwt';
import { login, logout, refreshTokens } from '../../application/auth.service';
import type { LoginResult } from '../../application/auth.service';
import { userRepository } from '../../infrastructure/user.repository';
import { sessionRepository } from '../../infrastructure/session.repository';
import { log, AUDIT_ACTIONS } from '@modules/supporting/audit';
import { identityService } from '@modules/supporting/identity';

// ── Constants ────────────────────────────────────────────────────────────────

const REFRESH_TTL_SEC_STAFF    = 60 * 60 * 24 * 7;
const REFRESH_TTL_SEC_CUSTOMER = 60 * 60 * 24 * 30;
const MFA_CHALLENGE_TTL_SEC    = 60 * 5;
const ACCESS_TTL_SEC           = 60 * 15;

const sharedCookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
}

function problemJson(type: string, title: string, status: number, detail?: string, extraHeaders?: Record<string, string>) {
  return NextResponse.json(
    { type: `https://docs.kollegan.ai/problems/${type}`, title, status, ...(detail ? { detail } : {}) },
    { status, headers: { 'Content-Type': 'application/problem+json', ...extraHeaders } },
  );
}

// ── Login ────────────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function handleLogin(req: NextRequest): Promise<NextResponse> {
  const ip = extractIp(req);

  const rl = await checkRateLimit(ip, 5, 60_000);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return problemJson('rate-limit', 'Too Many Requests', 429, undefined, {
      'Retry-After': String(retryAfter),
      'RateLimit-Remaining': '0',
      'RateLimit-Reset': String(retryAfter),
    });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return problemJson('bad-request', 'Bad Request', 400, 'Request body is not valid JSON');
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return problemJson('bad-request', 'Bad Request', 400, 'Invalid email or password format');
  }

  const { email, password } = parsed.data;
  const userAgent = req.headers.get('user-agent') ?? undefined;
  const ipAddress = ip !== 'unknown' ? ip : undefined;

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
      return problemJson('unauthorized', 'Unauthorized', 401, 'Invalid email or password', {
        'WWW-Authenticate': 'Bearer realm="api.kollegan.ai", charset="UTF-8"',
      });
    }
    if (code === 'MFA_SETUP_REQUIRED') {
      return problemJson('mfa-setup-required', 'MFA Setup Required', 403,
        'Your account requires MFA. Please contact your administrator or log in from a previous session to configure it.');
    }

    return problemJson('internal', 'Internal Server Error', 500);
  }

  if ('status' in outcome && outcome.status === 'mfa_required') {
    const challengeToken = await signMfaChallengeToken(outcome.userId);
    const res = NextResponse.json({ data: { status: 'mfa_required', methods: outcome.methods } }, { status: 202 });
    res.cookies.set('mfa_challenge', challengeToken, { ...sharedCookieOpts, maxAge: MFA_CHALLENGE_TTL_SEC });
    return res;
  }

  const loginResult = outcome as LoginResult;

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
      user: { id: loginResult.user.id, email: loginResult.user.email, userType: loginResult.user.userType, roles: loginResult.user.roles },
      ...(loginResult.mfaWarning ? { mfaWarning: { expiresAt: loginResult.mfaWarning.expiresAt } } : {}),
    },
  });

  res.cookies.set(cookieName, loginResult.refreshToken, { ...sharedCookieOpts, maxAge: ttlSec });
  res.cookies.set('at', loginResult.accessToken, { ...sharedCookieOpts, maxAge: ACCESS_TTL_SEC });

  return res;
}

// ── Logout ───────────────────────────────────────────────────────────────────

export async function handleLogout(req: NextRequest): Promise<NextResponse> {
  const staffToken  = req.cookies.get('token')?.value;
  const portalToken = req.cookies.get('portal_token')?.value;
  const rawToken    = staffToken ?? portalToken;

  if (rawToken) {
    let userId: string | undefined;
    const orgId: string | null = null;
    try {
      const hash    = hashOpaqueToken(rawToken);
      const session = await sessionRepository.findByTokenHash(hash);
      if (session) userId = session.userId;
    } catch { /* proceed to clear cookies */ }

    await logout(rawToken);

    if (userId) {
      await log({
        action: AUDIT_ACTIONS.USER_LOGOUT,
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

// ── Refresh ──────────────────────────────────────────────────────────────────

export async function handleRefresh(req: NextRequest): Promise<NextResponse> {
  const ip = extractIp(req);

  const rl = await checkRateLimit(`refresh:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return problemJson('rate-limit', 'Too Many Requests', 429, undefined, { 'Retry-After': String(retryAfter) });
  }

  const rawRefreshToken = req.cookies.get('token')?.value ?? req.cookies.get('portal_token')?.value;
  if (!rawRefreshToken) {
    return problemJson('unauthorized', 'Unauthorized', 401, 'No refresh token present', {
      'WWW-Authenticate': 'Bearer realm="api.kollegan.ai", charset="UTF-8"',
    });
  }

  let result: Awaited<ReturnType<typeof refreshTokens>>;
  try {
    result = await refreshTokens(rawRefreshToken);
  } catch {
    return problemJson('unauthorized', 'Unauthorized', 401, 'Invalid or expired refresh token', {
      'WWW-Authenticate': 'Bearer realm="api.kollegan.ai", charset="UTF-8"',
    });
  }

  await log({
    action: AUDIT_ACTIONS.USER_TOKEN_REFRESHED,
    organizationId: result.orgId,
    actorId: result.userId,
    actorType: 'user',
    resourceType: 'User',
    resourceId: result.userId,
    metadata: { ip: ip !== 'unknown' ? ip : null },
  }).catch(() => {});

  const isCustomer = result.userType === 'customer';
  const cookieName = isCustomer ? 'portal_token' : 'token';
  const ttlSec     = isCustomer ? REFRESH_TTL_SEC_CUSTOMER : REFRESH_TTL_SEC_STAFF;

  const res = NextResponse.json({ data: { accessToken: result.accessToken } });
  res.cookies.set(cookieName, result.refreshToken, { ...sharedCookieOpts, maxAge: ttlSec });
  res.cookies.set('at', result.accessToken, { ...sharedCookieOpts, maxAge: ACCESS_TTL_SEC });

  return res;
}

// ── Register ─────────────────────────────────────────────────────────────────
//
// Creates a new staff user, provisions a personal default organization,
// assigns the 'admin' role, and auto-logs them in so they land in the app
// with a valid session (at cookie) — no separate login step required.

const RegisterSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  orgName:  z.string().min(1).max(100).optional(),
});

export async function handleRegister(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email is required and password must be at least 8 characters.' }, { status: 400 });
  }

  const { email, password, orgName } = parsed.data;
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
  }

  // 1. Provision a default organization for this user.
  //    Slug is derived from the email local-part + a short time suffix for uniqueness.
  const localPart = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24);
  const suffix    = Date.now().toString(36).slice(-4);
  const orgSlug   = `${localPart}-${suffix}`;
  const resolvedOrgName = orgName?.trim() || `${email.split('@')[0]}'s Organization`;
  const plan = process.env.NODE_ENV === 'production' ? 'starter' : 'dev';
  const org  = await identityService.createOrg({ name: resolvedOrgName, slug: orgSlug, plan });

  // 2. Create the user assigned to the new org.
  const passwordHash      = await bcrypt.hash(password, 12);
  const mfaGraceExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const user = await userRepository.create({
    email, passwordHash, userType: 'staff',
    organizationId: org.id, mfaGraceExpiresAt,
  });

  // 3. Grant admin role so the user can manage templates, offers, etc.
  const adminRole = await userRepository.findRoleByName('admin');
  if (adminRole) {
    await userRepository.assignRole(user.id, adminRole.id, org.id, user.id);
  }

  // 4. Auto-login: issue access + refresh tokens so the browser is immediately
  //    authenticated — no separate /login call needed after registration.
  let loginOutcome;
  try {
    loginOutcome = await login({ email, password });
  } catch {
    // If login fails for any reason, still return 201 — user can log in manually.
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  }

  if ('status' in loginOutcome) {
    // MFA challenge (shouldn't happen for brand-new users within the grace window).
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  }

  const loginResult = loginOutcome as LoginResult;

  const res = NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  res.cookies.set('token', loginResult.refreshToken, { ...sharedCookieOpts, maxAge: REFRESH_TTL_SEC_STAFF });
  res.cookies.set('at',    loginResult.accessToken,  { ...sharedCookieOpts, maxAge: ACCESS_TTL_SEC });
  return res;
}

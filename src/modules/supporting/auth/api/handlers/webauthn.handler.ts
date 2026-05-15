/**
 * WebAuthn API handlers — colocated with the auth module.
 *
 * app/api/v1/auth/webauthn/ routes are thin re-export wrappers that point here.
 */

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyMfaChallengeToken } from '@platform/auth/jwt';
import { checkRateLimit } from '@platform/cache/rate-limiter';
import {
  beginRegistration,
  completeRegistration,
  beginAuthentication,
  completeAuthentication,
  listCredentials,
  deleteCredential,
} from '../../application/webauthn.service';
import { completeMfaLogin } from '../../application/auth.service';
import { AUTH_AUDIT_ACTIONS, recordAuthAudit } from '../../application/auth-audit.service';
import { userRepository } from '../../infrastructure/user.repository';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/browser';
import { BRAND_PROBLEM_BASE } from '@shared/branding';
import {
  assertStepUpForFactorMutation,
  verifyAccessPayload,
} from './auth-handler.utils';

// ── Helpers ──────────────────────────────────────────────────────────────────

// Reads the access JWT (at cookie) or Bearer token. The opaque refresh token
// cookies (token/portal_token) are NOT JWTs and must not be used here.
// ── Constants ────────────────────────────────────────────────────────────────

const REFRESH_TTL_SEC_STAFF          = 60 * 60 * 24 * 7;
const REFRESH_TTL_SEC_STAFF_REMEMBER = 60 * 60 * 24 * 30;
const REFRESH_TTL_SEC_CUSTOMER       = 60 * 60 * 24 * 30;
const ACCESS_TTL_SEC                 = 60 * 15;

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

function clearAuthCookies(res: NextResponse): void {
  res.cookies.set('token', '', { ...cookieOpts, maxAge: 0 });
  res.cookies.set('portal_token', '', { ...cookieOpts, maxAge: 0 });
  res.cookies.set('at', '', { ...cookieOpts, maxAge: 0 });
  res.cookies.set('mfa_challenge', '', { maxAge: 0, path: '/' });
}

// ── Register Options ─────────────────────────────────────────────────────────

export const handleRegisterOptions = createHandler(
  { auth: 'jwt', tag: 'WebAuthn:RegisterOptions', rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyAccessPayload(req);
    await assertStepUpForFactorMutation(payload.sub, payload.amr);
    const user = await userRepository.findById(payload.sub);
    const userEmail = user?.email ?? payload.sub;
    const options = await beginRegistration(payload.sub, userEmail);
    return ok(options);
  },
);

// ── Register Verify ──────────────────────────────────────────────────────────

const RegisterVerifySchema = z.object({
  response: z.record(z.string(), z.unknown()),
  name: z.string().min(1).max(64).default('Passkey'),
});

export const handleRegisterVerify = createHandler(
  { auth: 'jwt', tag: 'WebAuthn:RegisterVerify', body: RegisterVerifySchema, rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: { response: Record<string, unknown>; name: string }; req: NextRequest };
    const payload = await verifyAccessPayload(req);
    await assertStepUpForFactorMutation(payload.sub, payload.amr);
    try {
      const result = await completeRegistration(payload.sub, body.response as unknown as RegistrationResponseJSON, body.name);
      return ok({ credentialId: result.credentialId, message: 'Passkey registered successfully.' });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'CHALLENGE_EXPIRED') throw Errors.badRequest('Registration challenge expired — please start again');
      if (code === 'WEBAUTHN_FAILED') throw Errors.unauthorized('Passkey verification failed');
      throw err;
    }
  },
);

// ── Authenticate Options ─────────────────────────────────────────────────────

export async function handleAuthenticateOptions(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip') ?? 'unknown';

  const rl = await checkRateLimit(`webauthn:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { type: `${BRAND_PROBLEM_BASE}/rate-limit`, title: 'Too Many Requests', status: 429 },
      { status: 429, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  const challengeToken = req.cookies.get('mfa_challenge')?.value;
  if (!challengeToken) {
    return NextResponse.json(
      { type: `${BRAND_PROBLEM_BASE}/unauthorized`, title: 'Unauthorized', status: 401, detail: 'MFA challenge not found or expired' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  let userId: string;
  try {
    ({ userId } = await verifyMfaChallengeToken(challengeToken));
  } catch {
    return NextResponse.json(
      { type: `${BRAND_PROBLEM_BASE}/unauthorized`, title: 'Unauthorized', status: 401, detail: 'MFA challenge expired' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  try {
    const options = await beginAuthentication(userId);
    return NextResponse.json({ data: options });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'NO_CREDENTIALS') {
      return NextResponse.json(
      { type: `${BRAND_PROBLEM_BASE}/bad-request`, title: 'Bad Request', status: 400, detail: 'No passkeys registered for this account' },
        { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
      );
    }
    return NextResponse.json(
      { type: `${BRAND_PROBLEM_BASE}/internal`, title: 'Internal Server Error', status: 500 },
      { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }
}

// ── Authenticate Verify ──────────────────────────────────────────────────────

export async function handleAuthenticateVerify(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip') ?? 'unknown';

  const rl = await checkRateLimit(`webauthn:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { type: `${BRAND_PROBLEM_BASE}/rate-limit`, title: 'Too Many Requests', status: 429 },
      { status: 429, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  const challengeToken = req.cookies.get('mfa_challenge')?.value;
  if (!challengeToken) {
    return NextResponse.json(
      { type: `${BRAND_PROBLEM_BASE}/unauthorized`, title: 'Unauthorized', status: 401, detail: 'MFA challenge not found or expired' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  let userId: string;
  let rememberMe = false;
  try {
    ({ userId, rememberMe } = await verifyMfaChallengeToken(challengeToken));
  } catch {
    return NextResponse.json(
      { type: `${BRAND_PROBLEM_BASE}/unauthorized`, title: 'Unauthorized', status: 401, detail: 'MFA challenge expired' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json(
      { type: `${BRAND_PROBLEM_BASE}/bad-request`, title: 'Bad Request', status: 400 },
      { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  const userAgent = req.headers.get('user-agent') ?? undefined;
  const ipAddress = ip !== 'unknown' ? ip : undefined;

  try {
    await completeAuthentication(userId, body as AuthenticationResponseJSON);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    await recordAuthAudit({
      action: AUTH_AUDIT_ACTIONS.USER_LOGIN_FAILED,
      actorId: userId, actorType: 'user',
      resourceType: 'User', resourceId: userId,
      metadata: { ip: ipAddress ?? null, reason: code ?? 'WEBAUTHN_FAILED' },
    }).catch(() => {});

    if (code === 'CHALLENGE_EXPIRED') {
      return NextResponse.json(
      { type: `${BRAND_PROBLEM_BASE}/unauthorized`, title: 'Unauthorized', status: 401, detail: 'Passkey challenge expired — please start again' },
        { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
      );
    }
    return NextResponse.json(
      { type: `${BRAND_PROBLEM_BASE}/unauthorized`, title: 'Unauthorized', status: 401, detail: 'Passkey verification failed' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  const result = await completeMfaLogin(userId, 'hwk', ipAddress, userAgent, rememberMe);

  await recordAuthAudit({
    action: AUTH_AUDIT_ACTIONS.USER_LOGIN,
    organizationId: result.user.orgId,
    actorId: result.user.id, actorType: 'user',
    resourceType: 'User', resourceId: result.user.id,
    metadata: { ip: ipAddress ?? null, mfaMethod: 'webauthn' },
  }).catch(() => {});

  const isCustomer = result.user.userType === 'customer';
  const cookieName = isCustomer ? 'portal_token' : 'token';
  const ttlSec     = isCustomer
    ? REFRESH_TTL_SEC_CUSTOMER
    : (rememberMe ? REFRESH_TTL_SEC_STAFF_REMEMBER : REFRESH_TTL_SEC_STAFF);

  const res = NextResponse.json({
    data: { user: { id: result.user.id, email: result.user.email, userType: result.user.userType, roles: result.user.roles } },
  });

  // Set BOTH the refresh token AND the access token — the at cookie is required
  // for the middleware to pass requests through without a DB round-trip.
  res.cookies.set(cookieName, result.refreshToken, { ...cookieOpts, maxAge: ttlSec });
  res.cookies.set('at', result.accessToken, { ...cookieOpts, maxAge: ACCESS_TTL_SEC });
  res.cookies.set('mfa_challenge', '', { maxAge: 0, path: '/' });

  return res;
}

export const handleListPasskeys = createHandler(
  { auth: 'jwt', tag: 'WebAuthn:Credentials:List', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyAccessPayload(req);
    return ok({ credentials: await listCredentials(payload.sub) });
  },
);

export const handleDeletePasskey = createHandler(
  { auth: 'jwt', requireMfa: true, tag: 'WebAuthn:Credentials:Delete', rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyAccessPayload(req);

    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const credentialId = segments[segments.length - 1];
    if (!credentialId) {
      return NextResponse.json(
        { type: `${BRAND_PROBLEM_BASE}/bad-request`, title: 'Bad Request', status: 400, detail: 'Credential id is required' },
        { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
      );
    }

    try {
      await deleteCredential(credentialId, payload.sub);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'LAST_PRIMARY_FACTOR') {
        return NextResponse.json(
          { type: `${BRAND_PROBLEM_BASE}/forbidden`, title: 'Forbidden', status: 403, detail: 'Add another sign-in method before removing your last passkey' },
          { status: 403, headers: { 'Content-Type': 'application/problem+json' } },
        );
      }
      throw err;
    }

    const res = NextResponse.json({
      data: { message: 'Passkey removed. Sign in again to continue.' },
    });
    clearAuthCookies(res);
    return res;
  },
);

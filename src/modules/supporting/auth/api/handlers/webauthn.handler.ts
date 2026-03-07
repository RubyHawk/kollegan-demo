/**
 * WebAuthn API handlers — colocated with the auth module.
 *
 * app/api/auth/webauthn/ routes are thin re-export wrappers that point here.
 */

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken, verifyMfaChallengeToken } from '@platform/auth/jwt';
import { checkRateLimit } from '@platform/cache/rate-limiter';
import {
  beginRegistration,
  completeRegistration,
  beginAuthentication,
  completeAuthentication,
} from '../../application/webauthn.service';
import { completeMfaLogin } from '../../application/auth.service';
import { log, AUDIT_ACTIONS } from '@modules/supporting/audit';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/browser';

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7)
    ?? req.cookies.get('token')?.value
    ?? req.cookies.get('portal_token')?.value
    ?? '';
}

// ── Register Options ─────────────────────────────────────────────────────────

export const handleRegisterOptions = createHandler(
  { auth: 'jwt', tag: 'WebAuthn:RegisterOptions', rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    const options = await beginRegistration(payload.sub, String(payload['email'] ?? payload.sub));
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
    const payload = await verifyToken(extractToken(req));
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
      { type: 'https://docs.kollegan.ai/problems/rate-limit', title: 'Too Many Requests', status: 429 },
      { status: 429, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  const challengeToken = req.cookies.get('mfa_challenge')?.value;
  if (!challengeToken) {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'MFA challenge not found or expired' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  let userId: string;
  try {
    ({ userId } = await verifyMfaChallengeToken(challengeToken));
  } catch {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'MFA challenge expired' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  try {
    const options = await beginAuthentication(userId);
    return NextResponse.json({ data: options });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'NO_CREDENTIALS') {
      return NextResponse.json(
        { type: 'https://docs.kollegan.ai/problems/bad-request', title: 'Bad Request', status: 400, detail: 'No passkeys registered for this account' },
        { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
      );
    }
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/internal', title: 'Internal Server Error', status: 500 },
      { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }
}

// ── Authenticate Verify ──────────────────────────────────────────────────────

const REFRESH_TTL_SEC_STAFF    = 60 * 60 * 24 * 7;
const REFRESH_TTL_SEC_CUSTOMER = 60 * 60 * 24 * 30;

export async function handleAuthenticateVerify(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip') ?? 'unknown';

  const rl = await checkRateLimit(`webauthn:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/rate-limit', title: 'Too Many Requests', status: 429 },
      { status: 429, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  const challengeToken = req.cookies.get('mfa_challenge')?.value;
  if (!challengeToken) {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'MFA challenge not found or expired' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  let userId: string;
  try {
    ({ userId } = await verifyMfaChallengeToken(challengeToken));
  } catch {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'MFA challenge expired' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/bad-request', title: 'Bad Request', status: 400 },
      { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
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
      actorId: userId, actorType: 'user',
      resourceType: 'User', resourceId: userId,
      metadata: { ip: ipAddress ?? null, reason: code ?? 'WEBAUTHN_FAILED' },
    }).catch(() => {});

    if (code === 'CHALLENGE_EXPIRED') {
      return NextResponse.json(
        { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'Passkey challenge expired — please start again' },
        { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
      );
    }
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'Passkey verification failed' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  const result = await completeMfaLogin(userId, 'hwk', ipAddress, userAgent);

  await log({
    action: AUDIT_ACTIONS.USER_LOGIN,
    organizationId: result.user.orgId,
    actorId: result.user.id, actorType: 'user',
    resourceType: 'User', resourceId: result.user.id,
    metadata: { ip: ipAddress ?? null, mfaMethod: 'webauthn' },
  }).catch(() => {});

  const isCustomer = result.user.userType === 'customer';
  const cookieName = isCustomer ? 'portal_token' : 'token';
  const ttlSec     = isCustomer ? REFRESH_TTL_SEC_CUSTOMER : REFRESH_TTL_SEC_STAFF;

  const res = NextResponse.json({
    data: { user: { id: result.user.id, email: result.user.email, userType: result.user.userType, roles: result.user.roles } },
  });

  res.cookies.set(cookieName, result.refreshToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: ttlSec, path: '/',
  });
  res.cookies.set('mfa_challenge', '', { maxAge: 0, path: '/' });

  return res;
}

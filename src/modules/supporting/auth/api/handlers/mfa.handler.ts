/**
 * MFA API handlers — colocated with the auth module.
 *
 * app/api/auth/mfa/ routes are thin re-export wrappers that point here.
 */

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken, verifyMfaChallengeToken } from '@platform/auth/jwt';
import { checkRateLimit } from '@platform/cache/rate-limiter';
import {
  generateTotpSetup,
  enableTotp,
  disableMfa,
  getBackupCodeCount,
  regenerateBackupCodes,
  verifyTotpCode,
  consumeBackupCode,
} from '../../application/mfa.service';
import { completeMfaLogin } from '../../application/auth.service';
import { userRepository } from '../../infrastructure/user.repository';
import { log, AUDIT_ACTIONS } from '@modules/supporting/audit';

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7)
    ?? req.cookies.get('at')?.value
    ?? '';
}

// ── Setup ────────────────────────────────────────────────────────────────────

export const handleMfaSetup = createHandler(
  { auth: 'jwt', tag: 'MFA:Setup', rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    const user = await userRepository.findById(payload.sub);
    const userEmail = user?.email ?? payload.sub;
    const setup = await generateTotpSetup(payload.sub, userEmail);
    return ok({ secret: setup.secret, qrDataUrl: setup.qrDataUrl, otpAuthUrl: setup.otpAuthUrl });
  },
);

// ── Enable ───────────────────────────────────────────────────────────────────

const EnableSchema = z.object({ code: z.string().min(6).max(8) });

export const handleMfaEnable = createHandler(
  { auth: 'jwt', tag: 'MFA:Enable', body: EnableSchema, rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof EnableSchema>; req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    let backupCodes: string[];
    try {
      backupCodes = await enableTotp(payload.sub, body.code);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'INVALID_TOTP')
        throw Errors.unauthorized('Invalid TOTP code — check your authenticator app and try again');
      throw err;
    }
    return ok({ backupCodes, message: 'MFA enabled. Store these backup codes safely — they will not be shown again.' });
  },
);

// ── Disable ──────────────────────────────────────────────────────────────────

const DisableSchema = z.object({ code: z.string().min(1).max(20) });

export const handleMfaDisable = createHandler(
  { auth: 'jwt', tag: 'MFA:Disable', body: DisableSchema, rateLimit: { max: 5, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof DisableSchema>; req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    try {
      await disableMfa(payload.sub, body.code);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'INVALID_CODE') throw Errors.unauthorized('Invalid code');
      throw err;
    }
    return ok({ message: 'MFA has been disabled.' });
  },
);

// ── Backup Codes Count ───────────────────────────────────────────────────────

export const handleBackupCodeCount = createHandler(
  { auth: 'jwt', tag: 'MFA:BackupCodes', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    const remaining = await getBackupCodeCount(payload.sub);
    return ok({ remaining });
  },
);

// ── Regenerate Backup Codes ──────────────────────────────────────────────────

const RegenerateSchema = z.object({ totpCode: z.string().min(6).max(8) });

export const handleRegenerateBackupCodes = createHandler(
  { auth: 'jwt', tag: 'MFA:RegenerateBackupCodes', body: RegenerateSchema, requireMfa: true, rateLimit: { max: 5, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof RegenerateSchema>; req: NextRequest };
    const payload = await verifyToken(extractToken(req));
    let backupCodes: string[];
    try {
      backupCodes = await regenerateBackupCodes(payload.sub, body.totpCode);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'INVALID_TOTP') throw Errors.unauthorized('Invalid TOTP code');
      throw err;
    }
    return ok({ backupCodes, message: 'Backup codes regenerated. Store these safely — they will not be shown again.' });
  },
);

// ── MFA Verify (login step 2) ────────────────────────────────────────────────

const REFRESH_TTL_SEC_STAFF    = 60 * 60 * 24 * 7;
const REFRESH_TTL_SEC_CUSTOMER = 60 * 60 * 24 * 30;
const ACCESS_TTL_SEC           = 60 * 15;

const VerifySchema = z.object({ code: z.string().min(1).max(20) });

export async function handleMfaVerify(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip') ?? 'unknown';

  const rl = await checkRateLimit(`mfa:${ip}`, 10, 5 * 60_000);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/rate-limit', title: 'Too Many Requests', status: 429 },
      { status: 429, headers: { 'Content-Type': 'application/problem+json', 'Retry-After': String(retryAfter) } },
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

  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/bad-request', title: 'Bad Request', status: 400, detail: 'code is required' },
      { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  const { code } = parsed.data;
  const userAgent = req.headers.get('user-agent') ?? undefined;
  const ipAddress = ip !== 'unknown' ? ip : undefined;

  const totpValid = await verifyTotpCode(userId, code);
  if (!totpValid) {
    const backupValid = await consumeBackupCode(userId, code);
    if (!backupValid) {
      await log({
        action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
        actorId: userId, actorType: 'user',
        resourceType: 'User', resourceId: userId,
        metadata: { ip: ipAddress ?? null, reason: 'INVALID_MFA_CODE' },
      }).catch(() => {});

      return NextResponse.json(
        { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'Invalid MFA code' },
        { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
      );
    }
  }

  const result = await completeMfaLogin(userId, 'otp', ipAddress, userAgent);

  await log({
    action: AUDIT_ACTIONS.USER_LOGIN,
    organizationId: result.user.orgId,
    actorId: result.user.id, actorType: 'user',
    resourceType: 'User', resourceId: result.user.id,
    metadata: { ip: ipAddress ?? null, mfaMethod: 'totp' },
  }).catch(() => {});

  const isCustomer = result.user.userType === 'customer';
  const cookieName = isCustomer ? 'portal_token' : 'token';
  const ttlSec     = isCustomer ? REFRESH_TTL_SEC_CUSTOMER : REFRESH_TTL_SEC_STAFF;

  const res = NextResponse.json({
    data: { user: { id: result.user.id, email: result.user.email, userType: result.user.userType, roles: result.user.roles } },
  });

  const opts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
  res.cookies.set(cookieName, result.refreshToken, { ...opts, maxAge: ttlSec });
  res.cookies.set('at', result.accessToken, { ...opts, maxAge: ACCESS_TTL_SEC });
  res.cookies.set('mfa_challenge', '', { maxAge: 0, path: '/' });

  return res;
}

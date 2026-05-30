/**
 * MFA API handlers — colocated with the auth module.
 *
 * app/api/v1/auth/mfa/ routes are thin re-export wrappers that point here.
 */

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { ACCESS_TOKEN_MAX_AGE_SEC, verifyMfaChallengeToken } from '@platform/auth/jwt';
import { checkRateLimit } from '@platform/cache/rate-limiter';
import {
  generateTotpSetup,
  enableTotp,
  disableMfa,
  getBackupCodeCount,
  regenerateBackupCodes,
  verifyTotpCode,
  consumeBackupCode,
  getMfaStatus,
  resetMfaForRecovery,
} from '../../application/mfa.service';
import { completeMfaLogin, listActiveSessions } from '../../application/auth.service';
import { AUTH_AUDIT_ACTIONS, recordAuthAudit } from '../../application/auth-audit.service';
import { hasPermission } from '../../application/rbac.service';
import { userRepository } from '../../infrastructure/user.repository';
import { BRAND_PROBLEM_BASE } from '@shared/branding';
import {
  assertStepUpForFactorMutation,
  isMfaAuthenticated,
  verifyAccessPayload,
} from './auth-handler.utils';

const REFRESH_TTL_SEC_STAFF = 60 * 60 * 24 * 7;
const REFRESH_TTL_SEC_STAFF_REMEMBER = 60 * 60 * 24 * 30;
const REFRESH_TTL_SEC_CUSTOMER = 60 * 60 * 24 * 30;
const ACCESS_TTL_SEC = ACCESS_TOKEN_MAX_AGE_SEC;
const RECOVERY_GRACE_WINDOW_MS = 24 * 60 * 60 * 1000;

const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 0,
};

function clearAuthCookies(res: NextResponse): void {
  res.cookies.set('token', '', clearCookieOptions);
  res.cookies.set('portal_token', '', clearCookieOptions);
  res.cookies.set('at', '', clearCookieOptions);
  res.cookies.set('mfa_challenge', '', clearCookieOptions);
}

export const handleMfaStatus = createHandler(
  { auth: 'jwt', tag: 'MFA:Status', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyAccessPayload(req);
    const status = await getMfaStatus(payload.sub);
    return ok({
      ...status,
      currentSessionMfaAuthenticated: isMfaAuthenticated(payload.amr),
    });
  },
);

export const handleMfaSetup = createHandler(
  { auth: 'jwt', tag: 'MFA:Setup', rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyAccessPayload(req);
    await assertStepUpForFactorMutation(payload.sub, payload.amr);
    const user = await userRepository.findById(payload.sub);
    const userEmail = user?.email ?? payload.sub;
    const setup = await generateTotpSetup(payload.sub, userEmail);
    await recordAuthAudit({
      action: AUTH_AUDIT_ACTIONS.USER_MFA_TOTP_SETUP_STARTED,
      organizationId: user?.organizationId ?? null,
      actorId: payload.sub,
      actorType: 'user',
      resourceType: 'User',
      resourceId: payload.sub,
    }).catch(() => {});
    return ok({ secret: setup.secret, qrDataUrl: setup.qrDataUrl, otpAuthUrl: setup.otpAuthUrl });
  },
);

const EnableSchema = z.object({ code: z.string().min(6).max(8) });

export const handleMfaEnable = createHandler(
  { auth: 'jwt', tag: 'MFA:Enable', body: EnableSchema, rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof EnableSchema>; req: NextRequest };
    const payload = await verifyAccessPayload(req);
    await assertStepUpForFactorMutation(payload.sub, payload.amr);
    let backupCodes: string[];
    try {
      backupCodes = await enableTotp(payload.sub, body.code);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'INVALID_TOTP') {
        throw Errors.unauthorized('Invalid TOTP code — check your authenticator app and try again');
      }
      if (code === 'TOTP_SETUP_NOT_STARTED') {
        throw Errors.badRequest('Start TOTP setup before confirming it');
      }
      throw err;
    }
    const user = await userRepository.findById(payload.sub);
    await recordAuthAudit({
      action: AUTH_AUDIT_ACTIONS.USER_MFA_TOTP_ENABLED,
      organizationId: user?.organizationId ?? null,
      actorId: payload.sub,
      actorType: 'user',
      resourceType: 'User',
      resourceId: payload.sub,
    }).catch(() => {});
    return ok({ backupCodes, message: 'MFA enabled. Store these backup codes safely — they will not be shown again.' });
  },
);

export const handleMfaDisable = createHandler(
  { auth: 'jwt', tag: 'MFA:Disable', requireMfa: true, rateLimit: { max: 5, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyAccessPayload(req);
    try {
      await disableMfa(payload.sub);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'TOTP_NOT_ENABLED') throw Errors.badRequest('No authenticator app is configured on this account');
      if (code === 'LAST_PRIMARY_FACTOR') throw Errors.forbidden('Add another sign-in method before removing your authenticator app');
      throw err;
    }

    const user = await userRepository.findById(payload.sub);
    await recordAuthAudit({
      action: AUTH_AUDIT_ACTIONS.USER_MFA_TOTP_DISABLED,
      organizationId: user?.organizationId ?? null,
      actorId: payload.sub,
      actorType: 'user',
      resourceType: 'User',
      resourceId: payload.sub,
    }).catch(() => {});

    const res = NextResponse.json({
      data: { message: 'Authenticator app removed. Sign in again to continue.' },
    });
    clearAuthCookies(res);
    return res;
  },
);

export const handleBackupCodeCount = createHandler(
  { auth: 'jwt', tag: 'MFA:BackupCodes', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyAccessPayload(req);
    const remaining = await getBackupCodeCount(payload.sub);
    return ok({ remaining });
  },
);

export const handleRegenerateBackupCodes = createHandler(
  { auth: 'jwt', tag: 'MFA:RegenerateBackupCodes', requireMfa: true, rateLimit: { max: 5, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyAccessPayload(req);
    let backupCodes: string[];
    try {
      backupCodes = await regenerateBackupCodes(payload.sub);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'MFA_NOT_ENABLED') {
        throw Errors.badRequest('Add a sign-in method before generating backup codes');
      }
      throw err;
    }
    const user = await userRepository.findById(payload.sub);
    await recordAuthAudit({
      action: AUTH_AUDIT_ACTIONS.USER_MFA_BACKUP_CODES_REGENERATED,
      organizationId: user?.organizationId ?? null,
      actorId: payload.sub,
      actorType: 'user',
      resourceType: 'User',
      resourceId: payload.sub,
      metadata: { count: backupCodes.length },
    }).catch(() => {});
    return ok({ backupCodes, message: 'Backup codes regenerated. Store these safely — they will not be shown again.' });
  },
);

export const handleListSessions = createHandler(
  { auth: 'jwt', tag: 'MFA:Sessions', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await verifyAccessPayload(req);
    const sessions = await listActiveSessions(payload.sub);
    return ok({
      sessions: sessions.map((session) => ({
        id: session.id,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        issuedAt: session.issuedAt,
        expiresAt: session.expiresAt,
        mfaMethod: session.mfaMethod,
        mfaVerifiedAt: session.mfaVerifiedAt,
      })),
    });
  },
);

const ResetMfaSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().trim().min(8).max(500),
});

export const handleResetUserMfa = createHandler(
  { auth: 'jwt', tag: 'MFA:RecoveryReset', body: ResetMfaSchema, requireMfa: true, rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof ResetMfaSchema>; req: NextRequest };
    const payload = await verifyAccessPayload(req);
    const canResetMfa = await hasPermission(payload.roles, 'users.mfa_reset');
    if (!canResetMfa) {
      throw Errors.forbidden('You do not have permission to reset MFA');
    }

    const targetUser = await userRepository.findById(body.userId);
    if (!targetUser) {
      throw Errors.notFound('User');
    }

    const isCrossOrgReset = !payload.roles.includes('super_admin')
      && payload.orgId !== targetUser.organizationId;
    if (isCrossOrgReset) {
      throw Errors.forbidden('You can only reset MFA for users in your own organization');
    }

    const graceExpiresAt = new Date(Date.now() + RECOVERY_GRACE_WINDOW_MS);
    await resetMfaForRecovery(targetUser.id, graceExpiresAt);

    await recordAuthAudit({
      action: AUTH_AUDIT_ACTIONS.USER_MFA_RESET,
      organizationId: targetUser.organizationId,
      actorId: payload.sub,
      actorType: 'user',
      resourceType: 'User',
      resourceId: targetUser.id,
      metadata: {
        reason: body.reason,
        actorRoles: payload.roles,
        graceExpiresAt: graceExpiresAt.toISOString(),
      },
    }).catch(() => {});

    return ok({
      message: 'MFA was reset and a new enrollment grace period has started.',
      graceExpiresAt,
    });
  },
);

const VerifySchema = z.object({ code: z.string().min(1).max(20) });

export async function handleMfaVerify(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip') ?? 'unknown';

  const rl = await checkRateLimit(`mfa:${ip}`, 60, 5 * 60_000);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { type: `${BRAND_PROBLEM_BASE}/rate-limit`, title: 'Too Many Requests', status: 429 },
      { status: 429, headers: { 'Content-Type': 'application/problem+json', 'Retry-After': String(retryAfter) } },
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

  const userRl = await checkRateLimit(`mfa-user:${userId}`, 30, 5 * 60_000);
  if (!userRl.allowed) {
    const retryAfter = Math.ceil((userRl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { type: `${BRAND_PROBLEM_BASE}/rate-limit`, title: 'Too Many Requests', status: 429 },
      { status: 429, headers: { 'Content-Type': 'application/problem+json', 'Retry-After': String(retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { type: `${BRAND_PROBLEM_BASE}/bad-request`, title: 'Bad Request', status: 400 },
      { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { type: `${BRAND_PROBLEM_BASE}/bad-request`, title: 'Bad Request', status: 400, detail: 'code is required' },
      { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
    );
  }

  const { code } = parsed.data;
  const userAgent = req.headers.get('user-agent') ?? undefined;
  const ipAddress = ip !== 'unknown' ? ip : undefined;

  let mfaMethod: 'totp' | 'backup_code' = 'totp';
  const totpValid = await verifyTotpCode(userId, code);
  if (!totpValid) {
    const backupValid = await consumeBackupCode(userId, code);
    if (!backupValid) {
      await recordAuthAudit({
        action: AUTH_AUDIT_ACTIONS.USER_LOGIN_FAILED,
        actorId: userId,
        actorType: 'user',
        resourceType: 'User',
        resourceId: userId,
        metadata: { ip: ipAddress ?? null, reason: 'INVALID_MFA_CODE' },
      }).catch(() => {});

      return NextResponse.json(
        { type: `${BRAND_PROBLEM_BASE}/unauthorized`, title: 'Unauthorized', status: 401, detail: 'Invalid MFA code' },
        { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
      );
    }
    mfaMethod = 'backup_code';
  }

  const result = await completeMfaLogin(userId, 'otp', ipAddress, userAgent, rememberMe);

  if (mfaMethod === 'backup_code') {
    await recordAuthAudit({
      action: AUTH_AUDIT_ACTIONS.USER_MFA_BACKUP_CODE_USED,
      organizationId: result.user.orgId,
      actorId: result.user.id,
      actorType: 'user',
      resourceType: 'User',
      resourceId: result.user.id,
      metadata: { ip: ipAddress ?? null },
    }).catch(() => {});
  }

  await recordAuthAudit({
    action: AUTH_AUDIT_ACTIONS.USER_LOGIN,
    organizationId: result.user.orgId,
    actorId: result.user.id,
    actorType: 'user',
    resourceType: 'User',
    resourceId: result.user.id,
    metadata: { ip: ipAddress ?? null, mfaMethod },
  }).catch(() => {});

  const isCustomer = result.user.userType === 'customer';
  const cookieName = isCustomer ? 'portal_token' : 'token';
  const ttlSec = isCustomer
    ? REFRESH_TTL_SEC_CUSTOMER
    : (rememberMe ? REFRESH_TTL_SEC_STAFF_REMEMBER : REFRESH_TTL_SEC_STAFF);

  const res = NextResponse.json({
    data: { user: { id: result.user.id, email: result.user.email, userType: result.user.userType, roles: result.user.roles } },
  });

  const opts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
  res.cookies.set(cookieName, result.refreshToken, { ...opts, maxAge: ttlSec });
  res.cookies.set('at', result.accessToken, { ...opts, maxAge: ACCESS_TTL_SEC });
  res.cookies.set('mfa_challenge', '', { maxAge: 0, path: '/' });

  return res;
}

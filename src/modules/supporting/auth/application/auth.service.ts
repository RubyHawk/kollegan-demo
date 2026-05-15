/**
 * Auth service — login, logout, token refresh, email verification, password reset.
 *
 * Dual-write period (Phase 1): this service reads from usr_users first, then
 * falls back to the legacy demo_hotel_staff_users (StaffUser) table for
 * accounts that have not yet been migrated. Remove the StaffUser fallback in
 * Phase 3 after confirming all accounts are migrated.
 *
 * Phase 2 changes:
 *   - Two-step login: password → optional MFA challenge → tokens issued.
 *   - Opaque refresh tokens: 32-byte random value, SHA-256 hash stored in DB.
 *   - Grace period: users without MFA get a warning period before hard enforcement.
 *   - amr claim added to JWT: ['pwd'] or ['pwd','otp'] or ['pwd','hwk'].
 *
 * MFA enforcement rules (see requiresMfa()):
 *   - All staff users (userType='staff')
 *   - Customer admins (userType='customer' + role includes 'customer_admin')
 */

import bcrypt from 'bcryptjs';
import { prisma } from '@platform/database/prisma';
import { logger } from '@platform/logging/logger';
import {
  signAccessToken,
  blacklistUserTokens,
  generateOpaqueToken,
  hashOpaqueToken,
} from '@platform/auth/jwt';
import { userRepository } from '../infrastructure/user.repository';
import { sessionRepository } from '../infrastructure/session.repository';
import type { User } from '../domain/user.entity';
import { syncMfaState } from './mfa-state.service';
// SessionMfaMethod: the subset stored on the session row (backup_code maps to 'totp' for AMR purposes)
type SessionMfaMethod = 'totp' | 'webauthn';

const TAG = 'AuthService';
const MIN_BCRYPT_COST = 12;
const REFRESH_TTL_DAYS = 7;
const REMEMBER_ME_TTL_DAYS = 30;
const CUSTOMER_REFRESH_TTL_DAYS = 30;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
  rememberMe?: boolean;
}

/** Full token result — returned when MFA is not required or already completed. */
export interface LoginResult {
  accessToken: string;
  refreshToken: string; // raw opaque token — goes in the httpOnly cookie
  user: {
    id: string;
    email: string;
    userType: 'staff' | 'customer';
    orgId: string | null;
    roles: string[];
  };
  /** Non-null when MFA is not yet configured but grace period is still active. */
  mfaWarning?: { expiresAt: Date };
}

/** Returned when MFA is required but not yet verified. */
export interface MfaChallengeResult {
  status: 'mfa_required';
  userId: string;            // used by the login route to issue the mfa_challenge cookie
  methods: MfaMethod[];
}

export type MfaMethod = 'totp' | 'webauthn' | 'backup_code';

export type LoginOutcome = LoginResult | MfaChallengeResult;

// ─── MFA enforcement helpers ───────────────────────────────────────────────────

/**
 * Returns true if this user MUST complete MFA to get tokens.
 * Staff: always. Customer admins: yes. Customer viewers: no.
 */
function requiresMfa(userType: string, roles: string[]): boolean {
  if (userType === 'staff') return true;
  if (userType === 'customer' && roles.includes('customer_admin')) return true;
  return false;
}

/**
 * Returns true if the grace period has expired (user must set up MFA now).
 * mfaGraceExpiresAt = null means enforce immediately.
 */
function isGracePeriodExpired(mfaGraceExpiresAt: Date | null): boolean {
  if (mfaGraceExpiresAt === null) return true;
  return new Date() > mfaGraceExpiresAt;
}

// ─── Token issuance (shared) ───────────────────────────────────────────────────

async function issueTokens(
  user: User,
  roles: string[],
  amr: string[],
  ipAddress?: string,
  userAgent?: string,
  mfaVerifiedAt?: Date,
  mfaMethod?: SessionMfaMethod,
  rememberMe?: boolean,
): Promise<{ accessToken: string; refreshToken: string }> {
  const orgId = user.organizationId;
  const aud   = user.userType === 'staff' ? 'internal' : `customer:${orgId ?? 'unknown'}`;

  const jwtPayload = {
    sub: user.id,
    userType: user.userType as 'staff' | 'customer',
    orgId,
    roles,
    aud,
    amr,
  };

  const defaultTtlDays = user.userType === 'customer' ? CUSTOMER_REFRESH_TTL_DAYS : REFRESH_TTL_DAYS;
  const ttlDays = (rememberMe && user.userType !== 'customer') ? REMEMBER_ME_TTL_DAYS : defaultTtlDays;

  const [{ token: accessToken }, { raw: refreshToken, hash: refreshTokenHash }] = await Promise.all([
    signAccessToken(jwtPayload),
    Promise.resolve(generateOpaqueToken()),
  ]);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  await sessionRepository.create({
    userId: user.id,
    refreshTokenHash,
    userAgent,
    ipAddress,
    expiresAt,
    mfaVerifiedAt,
    mfaMethod,
  });

  return { accessToken, refreshToken };
}

// ─── login ─────────────────────────────────────────────────────────────────────

export async function login(input: LoginInput): Promise<LoginOutcome> {
  const email = input.email.toLowerCase().trim();

  // Step 1: resolve user (new table first, legacy fallback)
  let user: User | null = await userRepository.findByEmail(email);
  let roles: string[] = [];

  if (user) {
    if (!user.isActive) {
      throw Object.assign(new Error('Account is disabled'), { code: 'ACCOUNT_DISABLED' });
    }
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS' });
    }
    // On-login bcrypt cost upgrade
    const existingCost = Number(user.passwordHash.split('$')[2]);
    if (!isNaN(existingCost) && existingCost < MIN_BCRYPT_COST) {
      const newHash = await bcrypt.hash(input.password, MIN_BCRYPT_COST);
      await userRepository.updatePasswordHash(user.id, newHash);
    }
    roles = await userRepository.getUserRoles(user.id, user.organizationId ?? '');
  } else {
    // Legacy StaffUser fallback (Phase 1 dual-write — remove in Phase 3)
    const staffUser = await prisma.staffUser.findUnique({ where: { email } });
    if (!staffUser) {
      throw Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS' });
    }
    const valid = await bcrypt.compare(input.password, staffUser.passwordHash);
    if (!valid) {
      throw Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS' });
    }
    user = await migrateStaffUser(staffUser);
    roles = await userRepository.getUserRoles(user.id, user.organizationId ?? '');
  }

  await userRepository.updateLastLogin(user.id, input.ipAddress ?? null);
  const factorStatus = await syncMfaState(user.id);

  // Step 2: MFA enforcement
  if (requiresMfa(user.userType, roles)) {
    if (factorStatus.enabled) {
      logger.info(TAG, `Login step 1 complete — MFA required: ${email}`, { userId: user.id });
      return { status: 'mfa_required', userId: user.id, methods: factorStatus.loginMethods };
    }

    if (isGracePeriodExpired(factorStatus.graceExpiresAt)) {
      // Grace period expired — hard block until MFA is configured
      throw Object.assign(
        new Error('MFA setup required'),
        { code: 'MFA_SETUP_REQUIRED' },
      );
    }

    // Grace period still active — issue tokens with warning
    const tokens = await issueTokens(user, roles, ['pwd'], input.ipAddress, input.userAgent, undefined, undefined, input.rememberMe);
    logger.info(TAG, `Login OK (MFA grace period): ${email}`, { userId: user.id });
    return {
      ...tokens,
      user: { id: user.id, email: user.email, userType: user.userType as 'staff' | 'customer', orgId: user.organizationId, roles },
      mfaWarning: { expiresAt: factorStatus.graceExpiresAt! },
    };
  }

  // No MFA required for this user (customer viewers etc.)
  const tokens = await issueTokens(user, roles, ['pwd'], input.ipAddress, input.userAgent, undefined, undefined, input.rememberMe);
  logger.info(TAG, `Login: ${email}`, { userId: user.id, userType: user.userType });
  return {
    ...tokens,
    user: { id: user.id, email: user.email, userType: user.userType as 'staff' | 'customer', orgId: user.organizationId, roles },
  };
}

// ─── completeMfaLogin ──────────────────────────────────────────────────────────
//
// Called after the MFA challenge is verified (TOTP or WebAuthn).
// Looks up the user and issues the final tokens with amr=['pwd','otp'|'hwk'].

export async function getUserOrganizationId(userId: string): Promise<string | null> {
  return userRepository.findOrganizationIdById(userId);
}

export async function completeMfaLogin(
  userId: string,
  amrMethod: 'otp' | 'hwk', // IANA AMR values: otp=TOTP/backup, hwk=hardware key (WebAuthn)
  ipAddress?: string,
  userAgent?: string,
  rememberMe?: boolean,
): Promise<LoginResult> {
  const user = await userRepository.findById(userId);
  if (!user || !user.isActive) {
    throw Object.assign(new Error('User not found or disabled'), { code: 'INVALID_CREDENTIALS' });
  }

  const roles = await userRepository.getUserRoles(userId, user.organizationId ?? '');
  const amr   = ['pwd', amrMethod];
  const mfaMethod: SessionMfaMethod = amrMethod === 'hwk' ? 'webauthn' : 'totp';
  const tokens = await issueTokens(user, roles, amr, ipAddress, userAgent, new Date(), mfaMethod, rememberMe);

  logger.info(TAG, `MFA login complete (${amrMethod}): ${user.email}`, { userId });

  return {
    ...tokens,
    user: { id: user.id, email: user.email, userType: user.userType as 'staff' | 'customer', orgId: user.organizationId, roles },
  };
}

// ─── logout ────────────────────────────────────────────────────────────────────

export async function logout(rawRefreshToken: string): Promise<void> {
  try {
    const hash = hashOpaqueToken(rawRefreshToken);
    const session = await sessionRepository.findByTokenHash(hash);
    if (session) {
      await sessionRepository.revoke(hash);
    }
    logger.info(TAG, 'Logout', { sessionId: session?.id ?? 'unknown' });
  } catch {
    // Ignore errors on logout — idempotent
  }
}

// ─── revokeAllSessions ─────────────────────────────────────────────────────────

export async function revokeAllSessions(userId: string): Promise<void> {
  await Promise.all([
    sessionRepository.revokeAllForUser(userId),
    blacklistUserTokens(userId),
  ]);
  logger.info(TAG, 'All sessions revoked', { userId });
}

export async function listActiveSessions(userId: string) {
  return sessionRepository.listActiveForUser(userId);
}

// ─── refreshTokens ─────────────────────────────────────────────────────────────

export async function refreshTokens(rawRefreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  userId: string;
  userType: 'staff' | 'customer';
  orgId: string | null;
}> {
  const hash = hashOpaqueToken(rawRefreshToken);

  const session = await sessionRepository.findByTokenHash(hash);
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw Object.assign(new Error('Session not found or revoked'), { code: 'SESSION_INVALID' });
  }

  const user = await userRepository.findById(session.userId);
  if (!user || !user.isActive) {
    throw Object.assign(new Error('User not found or disabled'), { code: 'INVALID_CREDENTIALS' });
  }

  const roles = await userRepository.getUserRoles(user.id, user.organizationId ?? '');

  // Reconstruct amr from the session — mfaMethod tells us exactly which factor was used.
  // 'webauthn' → 'hwk' (hardware key); 'totp' → 'otp'; null → password-only.
  let amr: string[] = ['pwd'];
  if (session.mfaVerifiedAt && session.mfaMethod) {
    amr = session.mfaMethod === 'webauthn' ? ['pwd', 'hwk'] : ['pwd', 'otp'];
  }

  // Rotate: revoke old session, issue new tokens
  await sessionRepository.revoke(hash);

  const tokens = await issueTokens(
    user,
    roles,
    amr,
    session.ipAddress ?? undefined,
    session.userAgent ?? undefined,
    session.mfaVerifiedAt ?? undefined,
    session.mfaMethod ?? undefined,
  );

  return {
    ...tokens,
    userId: user.id,
    userType: user.userType as 'staff' | 'customer',
    orgId: user.organizationId,
  };
}

// ─── migrateStaffUser (private) ───────────────────────────────────────────────
// Auto-migrates a legacy StaffUser to usr_users on first login via new auth.
// Remove this in Phase 3 after manual migration is complete.

async function migrateStaffUser(staffUser: {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  lastLogin: Date | null;
}): Promise<User> {
  const demoOrgId = await userRepository.findOrCreateLegacyDemoOrganizationId();

  const roleMap: Record<string, string> = {
    receptionist: 'user',
    manager: 'admin',
    admin: 'admin',
  };
  const newRoleName = roleMap[staffUser.role] ?? 'user';

  let user: User;
  try {
    user = await userRepository.create({
      email: staffUser.email,
      passwordHash: staffUser.passwordHash,
      userType: 'staff',
      organizationId: demoOrgId,
    });
  } catch (err) {
    const isPrismaUniqueViolation =
      typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002';
    if (!isPrismaUniqueViolation) throw err;
    const existing = await userRepository.findByEmail(staffUser.email);
    if (!existing) throw err;
    user = existing;
    logger.info(TAG, `Race condition on migration resolved for ${staffUser.email}`, {
      existingId: existing.id,
    });
  }

  const role = await userRepository.findRoleByName(newRoleName);
  if (role) {
    await userRepository.assignRole(user.id, role.id, demoOrgId);
  }

  logger.info(TAG, `Auto-migrated StaffUser → User: ${staffUser.email}`, {
    oldId: staffUser.id,
    newId: user.id,
  });

  return user;
}

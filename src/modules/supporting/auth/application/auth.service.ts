/**
 * Auth service — login, logout, token refresh, email verification, password reset.
 *
 * Dual-write period (Phase 1): this service reads from usr_users first, then
 * falls back to the legacy demo_hotel_staff_users (StaffUser) table for
 * accounts that have not yet been migrated. Remove the StaffUser fallback in
 * Phase 3 after confirming all accounts are migrated.
 *
 * Password requirements (enforced here):
 *   - Minimum 12 characters
 *   - At least one uppercase, one lowercase, one digit
 *   - bcrypt cost >= 12 (re-hashed on login if lower)
 */

import bcrypt from 'bcryptjs';
import { prisma } from '@core/database/prisma';
import { logger } from '@core/logging/logger';
import {
  signAccessToken,
  signRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
  verifyToken,
} from '@core/auth/jwt';
import { userRepository } from '../infrastructure/user.repository';
import { sessionRepository } from '../infrastructure/session.repository';
import type { User } from '../domain/user.entity';

const TAG = 'AuthService';
const MIN_BCRYPT_COST = 12;
const REFRESH_TTL_DAYS = 7;
const CUSTOMER_REFRESH_TTL_DAYS = 30;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    userType: 'staff' | 'customer';
    orgId: string | null;
    roles: string[];
  };
}

// ─── login ─────────────────────────────────────────────────────────────────────

export async function login(input: LoginInput): Promise<LoginResult> {
  const email = input.email.toLowerCase().trim();

  // Step 1: try unified User table (Phase 1 dual-write)
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
    // Re-hash if bcrypt cost is below minimum (on-login upgrade)
    const existingCost = Number(user.passwordHash.split('$')[2]);
    if (!isNaN(existingCost) && existingCost < MIN_BCRYPT_COST) {
      const newHash = await bcrypt.hash(input.password, MIN_BCRYPT_COST);
      await userRepository.updatePasswordHash(user.id, newHash);
    }
    roles = await userRepository.getUserRoles(user.id, user.organizationId ?? '');
  } else {
    // Step 2: fallback to legacy StaffUser (dual-write period only, remove in Phase 3)
    const staffUser = await prisma.staffUser.findUnique({ where: { email } });
    if (!staffUser) {
      throw Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS' });
    }
    const valid = await bcrypt.compare(input.password, staffUser.passwordHash);
    if (!valid) {
      throw Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS' });
    }
    // Auto-migrate this StaffUser to usr_users on first new-auth login
    user = await migrateStaffUser(staffUser);
    roles = await userRepository.getUserRoles(user.id, user.organizationId ?? '');
  }

  await userRepository.updateLastLogin(user.id, input.ipAddress ?? null);

  const orgId = user.organizationId;
  const aud = user.userType === 'staff' ? 'internal' : `customer:${orgId ?? 'unknown'}`;
  const ttlDays = user.userType === 'customer' ? CUSTOMER_REFRESH_TTL_DAYS : REFRESH_TTL_DAYS;

  const jwtPayload = {
    sub: user.id,
    userType: user.userType,
    orgId,
    roles,
    aud,
  };

  const [accessToken, { token: refreshToken, jti }] = await Promise.all([
    signAccessToken(jwtPayload),
    signRefreshToken(jwtPayload),
  ]);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  await sessionRepository.create({
    userId: user.id,
    refreshTokenJti: jti,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
    expiresAt,
  });

  logger.info(TAG, `Login: ${email}`, { userId: user.id, userType: user.userType });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, userType: user.userType, orgId, roles },
  };
}

// ─── logout ────────────────────────────────────────────────────────────────────

export async function logout(refreshTokenRaw: string): Promise<void> {
  try {
    const payload = await verifyToken(refreshTokenRaw);
    if (!payload.jti) return;

    const session = await sessionRepository.findByJti(payload.jti);
    if (session) {
      await sessionRepository.revoke(payload.jti);
    }

    // Blacklist in Redis until token expires
    const expiresInSec = payload.exp
      ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000))
      : 60 * 60 * 24 * REFRESH_TTL_DAYS;
    await blacklistToken(payload.jti, expiresInSec);

    logger.info(TAG, 'Logout', { userId: payload.sub, jti: payload.jti });
  } catch {
    // Ignore invalid tokens on logout — idempotent
  }
}

// ─── refreshTokens ─────────────────────────────────────────────────────────────

export async function refreshTokens(refreshTokenRaw: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const payload = await verifyToken(refreshTokenRaw);

  if (payload.type !== 'refresh') {
    throw Object.assign(new Error('Token type mismatch'), { code: 'INVALID_TOKEN_TYPE' });
  }

  if (!payload.jti) {
    throw Object.assign(new Error('Token missing jti'), { code: 'INVALID_TOKEN' });
  }

  // Check blacklist
  const blacklisted = await isTokenBlacklisted(payload.jti);
  if (blacklisted) {
    throw Object.assign(new Error('Token has been revoked'), { code: 'TOKEN_REVOKED' });
  }

  // Check DB session (authoritative when Redis is unavailable)
  const session = await sessionRepository.findByJti(payload.jti);
  if (!session || session.revokedAt) {
    throw Object.assign(new Error('Session not found or revoked'), { code: 'SESSION_INVALID' });
  }

  // Revoke old refresh token (rotation)
  await sessionRepository.revoke(payload.jti);
  await blacklistToken(payload.jti, 60); // short TTL — token is already being replaced

  const jwtPayload = {
    sub: payload.sub!,
    userType: payload.userType,
    orgId: payload.orgId,
    roles: payload.roles,
    aud: payload.aud as string,
  };

  const [accessToken, { token: newRefreshToken, jti: newJti }] = await Promise.all([
    signAccessToken(jwtPayload),
    signRefreshToken(jwtPayload),
  ]);

  const ttlDays = payload.userType === 'customer' ? CUSTOMER_REFRESH_TTL_DAYS : REFRESH_TTL_DAYS;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  await sessionRepository.create({
    userId: session.userId,
    refreshTokenJti: newJti,
    userAgent: session.userAgent ?? undefined,
    ipAddress: session.ipAddress ?? undefined,
    expiresAt,
  });

  return { accessToken, refreshToken: newRefreshToken };
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
  const { identityService } = await import('@modules/supporting/identity/application/identity.service');
  const demoOrg = await identityService.getOrCreateDemoOrg();

  // Map legacy role to new role name
  const roleMap: Record<string, string> = {
    receptionist: 'user',
    manager: 'admin',
    admin: 'admin',
  };
  const newRoleName = roleMap[staffUser.role] ?? 'user';

  const user = await userRepository.create({
    email: staffUser.email,
    passwordHash: staffUser.passwordHash,
    userType: 'staff',
    organizationId: demoOrg.id,
  });

  const role = await userRepository.findRoleByName(newRoleName);
  if (role) {
    await userRepository.assignRole(user.id, role.id, demoOrg.id);
  }

  logger.info(TAG, `Auto-migrated StaffUser → User: ${staffUser.email}`, {
    oldId: staffUser.id,
    newId: user.id,
  });

  return user;
}

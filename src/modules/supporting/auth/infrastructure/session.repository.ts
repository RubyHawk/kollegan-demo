// ─── Session repository ───────────────────────────────────────────────────────
// Phase 2: refreshTokenJti replaced by refreshTokenHash (SHA-256 of opaque token).
// Phase 2 fix: mfaMethod added to preserve which MFA method was used across refreshes.

import { prisma } from '@platform/database/prisma';
import type { Session, CreateSessionInput, MfaMethod, SessionUser } from '../domain/session.entity';

const ROLE_PRIORITY = [
  'super_admin',
  'admin',
  'helpdesk',
  'user',
  'viewer',
  'customer_admin',
  'customer_viewer',
  'restaurant_owner',
  'restaurant_manager',
  'restaurant_staff',
  'restaurant_kitchen',
  'restaurant_accountant',
] as const;

function pickPrimaryRole(roles: string[], fallback: string): string {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return roles[0] ?? fallback;
}

export const sessionRepository = {
  async create(input: CreateSessionInput): Promise<Session> {
    return prisma.session.create({
      data: {
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
        expiresAt: input.expiresAt,
        mfaVerifiedAt: input.mfaVerifiedAt ?? null,
        mfaMethod: input.mfaMethod ?? null,
      },
    }) as Promise<Session>;
  },

  async findByTokenHash(hash: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { refreshTokenHash: hash } }) as Promise<Session | null>;
  },

  async findSessionUserByTokenHash(hash: string): Promise<SessionUser | null> {
    const session = await prisma.session.findUnique({ where: { refreshTokenHash: hash } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

    const user = await prisma.user.findFirst({
      where: { id: session.userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        userType: true,
        organizationId: true,
        mfaEnabled: true,
      },
    });
    if (!user) return null;

    const userRoles = await prisma.userRole.findMany({
      where: { userId: session.userId },
      include: { role: true },
    }).catch(() => []);
    const roles = userRoles.map((userRole) => userRole.role.name);
    const role = pickPrimaryRole(roles, user.userType ?? 'staff');

    return {
      ...user,
      orgId: user.organizationId,
      role,
      roles,
      mfaAuthenticated: !!session.mfaVerifiedAt && !!session.mfaMethod,
    };
  },

  async revoke(hash: string): Promise<void> {
    await prisma.session.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async listActiveForUser(userId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { issuedAt: 'desc' },
    }) as Promise<Session[]>;
  },

  async setMfaVerified(hash: string, method: MfaMethod): Promise<void> {
    await prisma.session.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { mfaVerifiedAt: new Date(), mfaMethod: method },
    });
  },
};

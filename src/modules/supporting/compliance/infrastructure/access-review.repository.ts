import { prisma } from '@platform/database/prisma';
import type { AccessReviewUserRow } from '../domain/access-review.entity';

type AccessReviewUserRecord = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  userType: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  mfaEnabled: boolean;
  totpSecret: string | null;
  mfaGraceExpiresAt: Date | null;
  organizationId: string | null;
  createdAt: Date;
  roles: Array<{ role: { name: string } }>;
  sessions: Array<{ id: string }>;
  _count: { webAuthnCredentials: number };
};

function toAccessReviewUserRow(user: AccessReviewUserRecord): AccessReviewUserRow {
  return {
    id: user.id,
    email: user.email,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
    userType: user.userType,
    isActive: user.isActive,
    organizationId: user.organizationId,
    roles: user.roles.map((r) => r.role.name),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    mfaEnabled: user.mfaEnabled,
    totpConfigured: !!user.totpSecret,
    passkeysRegistered: user._count.webAuthnCredentials,
    mfaGraceExpiresAt: user.mfaGraceExpiresAt?.toISOString() ?? null,
    activeSessions: user.sessions.length,
    createdAt: user.createdAt.toISOString(),
  };
}

export const accessReviewRepository = {
  async listUsers(organizationId: string | null): Promise<AccessReviewUserRow[]> {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(organizationId ? { organizationId } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        isActive: true,
        lastLoginAt: true,
        mfaEnabled: true,
        totpSecret: true,
        mfaGraceExpiresAt: true,
        organizationId: true,
        createdAt: true,
        roles: { include: { role: true } },
        sessions: {
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          select: { id: true },
        },
        _count: { select: { webAuthnCredentials: true } },
      },
      orderBy: [{ organizationId: 'asc' }, { email: 'asc' }],
    });

    return (users as AccessReviewUserRecord[]).map(toAccessReviewUserRow);
  },
};

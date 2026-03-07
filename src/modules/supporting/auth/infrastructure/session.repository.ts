// ─── Session repository ───────────────────────────────────────────────────────
// Phase 2: refreshTokenJti replaced by refreshTokenHash (SHA-256 of opaque token).
// Phase 2 fix: mfaMethod added to preserve which MFA method was used across refreshes.

import { prisma } from '@platform/database/prisma';
import type { Session, CreateSessionInput, MfaMethod } from '../domain/session.entity';

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

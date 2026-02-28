// ─── Session repository ───────────────────────────────────────────────────────

import { prisma } from '@core/database/prisma';
import type { Session, CreateSessionInput } from '../domain/session.entity';

export const sessionRepository = {
  async create(input: CreateSessionInput): Promise<Session> {
    return prisma.session.create({
      data: {
        userId: input.userId,
        refreshTokenJti: input.refreshTokenJti,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
        expiresAt: input.expiresAt,
      },
    });
  },

  async findByJti(jti: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { refreshTokenJti: jti } });
  },

  async revoke(jti: string): Promise<void> {
    await prisma.session.updateMany({
      where: { refreshTokenJti: jti, revokedAt: null },
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
    });
  },
};

// A.8.32 — Change Management: session tracking and MFA verification rates

import { prisma } from '@platform/database/prisma';
import type { CollectorResult } from '../../domain/evidence.entity';

export async function sessionTrackingCollector(
  organizationId: string,
  controlId: string
): Promise<CollectorResult> {
  const now = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Active sessions for users in this org
  const [activeSessions, mfaVerifiedSessions, revokedLast30d] = await Promise.all([
    prisma.session.count({
      where: {
        user: { organizationId },
        revokedAt: null,
        expiresAt: { gt: now },
      },
    }),
    prisma.session.count({
      where: {
        user: { organizationId },
        revokedAt: null,
        expiresAt: { gt: now },
        mfaVerifiedAt: { not: null },
      },
    }),
    prisma.session.count({
      where: {
        user: { organizationId },
        revokedAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  const mfaRate = activeSessions === 0 ? 1 : mfaVerifiedSessions / activeSessions;
  const status = mfaRate >= 1.0 ? 'pass' : mfaRate >= 0.8 ? 'warn' : 'fail';

  return {
    controlId,
    status,
    payload: { activeSessions, mfaVerifiedSessions, mfaRate: Math.round(mfaRate * 100), revokedLast30d },
    summary: `${activeSessions} active sessions; ${mfaVerifiedSessions}/${activeSessions} (${Math.round(mfaRate * 100)}%) MFA-verified; ${revokedLast30d} revoked in last 30 days`,
  };
}

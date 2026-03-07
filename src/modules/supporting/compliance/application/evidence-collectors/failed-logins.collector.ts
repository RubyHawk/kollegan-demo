// A.8.16 — Monitoring Activities: failed login attempts in last 30 days

import { prisma } from '@platform/database/prisma';
import type { CollectorResult } from '../../domain/evidence.entity';

export async function failedLoginsCollector(
  organizationId: string,
  controlId: string
): Promise<CollectorResult> {
  const windowDays = 30;
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const count = await prisma.auditLog.count({
    where: {
      organizationId,
      action:     'user.login_failed',
      occurredAt: { gte: since },
    },
  });

  const status = count < 100 ? 'pass' : count < 500 ? 'warn' : 'fail';

  return {
    controlId,
    status,
    payload: { failedLoginCount: count, windowDays, since: since.toISOString() },
    summary: `${count} failed login attempt${count !== 1 ? 's' : ''} in the last ${windowDays} days`,
  };
}

// A.8.15 — Logging: audit log health check (row count, recency)

import { prisma } from '@platform/database/prisma';
import type { CollectorResult } from '../../domain/evidence.entity';

export async function auditLogHealthCollector(
  organizationId: string,
  controlId: string
): Promise<CollectorResult> {
  const [total, latest] = await Promise.all([
    prisma.auditLog.count({ where: { organizationId } }),
    prisma.auditLog.findFirst({
      where:   { organizationId },
      orderBy: { occurredAt: 'desc' },
      select:  { occurredAt: true },
    }),
  ]);

  const hoursSinceLast = latest
    ? (Date.now() - latest.occurredAt.getTime()) / 1000 / 3600
    : Infinity;

  const status = hoursSinceLast < 24 ? 'pass' : hoursSinceLast < 72 ? 'warn' : 'fail';

  return {
    controlId,
    status,
    payload: {
      totalEntries:        total,
      lastEntryAt:         latest?.occurredAt.toISOString() ?? null,
      hoursSinceLastEntry: Math.round(hoursSinceLast),
    },
    summary: `Audit log: ${total.toLocaleString()} entries; last entry ${latest ? `${Math.round(hoursSinceLast)}h ago` : 'never'}`,
  };
}

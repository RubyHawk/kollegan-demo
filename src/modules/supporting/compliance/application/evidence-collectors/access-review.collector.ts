// A.8.34 — Protection During Audit: last access review completion date

import { prisma } from '@platform/database/prisma';
import type { CollectorResult } from '../../domain/evidence.entity';

export async function accessReviewCollector(
  organizationId: string,
  controlId: string
): Promise<CollectorResult> {
  // Look for the most recent access-review API call in audit logs.
  // The access-review endpoint is at /api/admin/access-review and is
  // logged via the createHandler middleware with tag 'Admin:AccessReview'.
  const lastReview = await prisma.auditLog.findFirst({
    where: {
      organizationId,
      resourceType: 'AccessReview',
    },
    orderBy: { occurredAt: 'desc' },
    select:  { occurredAt: true, actorId: true },
  });

  // Fallback: check for any audit entry with action containing 'access_review'
  const fallback = !lastReview
    ? await prisma.auditLog.findFirst({
        where: {
          organizationId,
          action: { contains: 'access_review' },
        },
        orderBy: { occurredAt: 'desc' },
        select:  { occurredAt: true },
      })
    : null;

  const lastAt = lastReview?.occurredAt ?? fallback?.occurredAt ?? null;
  const daysSince = lastAt
    ? Math.floor((Date.now() - lastAt.getTime()) / 1000 / 86400)
    : null;

  const status = daysSince === null ? 'warn'
    : daysSince <= 90  ? 'pass'
    : daysSince <= 120 ? 'warn'
    : 'fail';

  return {
    controlId,
    status,
    payload: {
      lastCompletedAt: lastAt?.toISOString() ?? null,
      daysSinceLastReview: daysSince,
      reviewThresholdDays: 90,
    },
    summary: lastAt
      ? `Last access review completed ${daysSince} day${daysSince !== 1 ? 's' : ''} ago (${lastAt.toISOString().split('T')[0]})`
      : 'No access review recorded — navigate to /admin/access-review to run one',
  };
}

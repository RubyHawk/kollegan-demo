// A.8.2 — Privileged Access Rights: admin user count and privilege changes

import { prisma } from '@core/database/prisma';
import type { CollectorResult } from '../../domain/evidence.entity';

export async function privilegedAccessCollector(
  organizationId: string,
  controlId: string
): Promise<CollectorResult> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [adminUsers, privilegedChanges] = await Promise.all([
    // Count users with admin or super_admin role
    prisma.user.findMany({
      where: {
        organizationId,
        deletedAt: null,
        roles: { some: { role: { name: { in: ['admin', 'super_admin'] } } } },
      },
      select: { email: true, id: true },
    }),
    // Count privilege-related audit events in last 30 days
    prisma.auditLog.count({
      where: {
        organizationId,
        action: { in: ['user.created', 'user.deactivated', 'user.role_granted', 'user.role_revoked'] },
        occurredAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  type UserRow = { email: string; id: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typed = adminUsers as any as UserRow[];

  return {
    controlId,
    status:  'pass',
    payload: {
      adminCount:           typed.length,
      privilegedChanges30d: privilegedChanges,
      adminEmails:          typed.map((u: UserRow) => u.email),
    },
    summary: `${adminUsers.length} admin user${adminUsers.length !== 1 ? 's' : ''}; ${privilegedChanges} privilege change${privilegedChanges !== 1 ? 's' : ''} in last 30 days`,
  };
}

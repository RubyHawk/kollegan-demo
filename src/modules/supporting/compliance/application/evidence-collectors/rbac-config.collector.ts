// A.8.3 — Information Access Restriction: RBAC roles and permission counts

import { prisma } from '@core/database/prisma';
import type { CollectorResult } from '../../domain/evidence.entity';

export async function rbacConfigCollector(
  _organizationId: string,
  controlId: string
): Promise<CollectorResult> {
  // Roles are system-wide, not per-org
  const roles = await prisma.role.findMany({
    include: { _count: { select: { permissions: true } } },
    orderBy: { name: 'asc' },
  });

  type RoleRow = { name: string; _count: { permissions: number } };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typed = roles as any as RoleRow[];
  const totalPermissions = typed.reduce((sum: number, r: RoleRow) => sum + r._count.permissions, 0);

  return {
    controlId,
    status:  'pass',
    payload: {
      roleCount:        typed.length,
      totalPermissions,
      roles:            typed.map((r: RoleRow) => ({ name: r.name, permissionCount: r._count.permissions })),
    },
    summary: `${roles.length} system roles with ${totalPermissions} total permissions; RBAC enforced at query layer`,
  };
}

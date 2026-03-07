// A.8.5 — Secure Authentication: MFA adoption rate for staff users

import { prisma } from '@platform/database/prisma';
import type { CollectorResult } from '../../domain/evidence.entity';

export async function mfaAdoptionCollector(
  organizationId: string,
  controlId: string
): Promise<CollectorResult> {
  const [total, mfaEnabled] = await Promise.all([
    prisma.user.count({
      where: { organizationId, userType: 'staff', deletedAt: null },
    }),
    prisma.user.count({
      where: { organizationId, userType: 'staff', deletedAt: null, mfaEnabled: true },
    }),
  ]);

  const adoptionRate = total === 0 ? 100 : Math.round((mfaEnabled / total) * 100);
  const status = adoptionRate >= 100 ? 'pass' : adoptionRate >= 80 ? 'warn' : 'fail';

  return {
    controlId,
    status,
    payload: { total, mfaEnabled, adoptionRate },
    summary: `MFA adoption: ${adoptionRate}% of staff users (${mfaEnabled}/${total}) have MFA enabled`,
  };
}

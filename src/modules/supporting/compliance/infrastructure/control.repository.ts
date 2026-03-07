// Read-only repository — cmp_controls is seeded data, never mutated at runtime.

import { prisma } from '@platform/database/prisma';
import type { ComplianceControl } from '../domain/control.entity';

function toEntity(raw: {
  id: string; controlId: string; name: string; description: string;
  category: string; evidenceType: string; isActive: boolean;
}): ComplianceControl {
  return {
    id:           raw.id,
    controlId:    raw.controlId,
    name:         raw.name,
    description:  raw.description,
    category:     raw.category,
    evidenceType: raw.evidenceType as 'automated' | 'manual',
    isActive:     raw.isActive,
  };
}

export const controlRepository = {
  async findAll(): Promise<ComplianceControl[]> {
    const rows = await prisma.complianceControl.findMany({
      where:   { isActive: true },
      orderBy: { controlId: 'asc' },
    });
    return rows.map(toEntity);
  },

  async findById(id: string): Promise<ComplianceControl | null> {
    const row = await prisma.complianceControl.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  },

  async findByControlId(controlId: string): Promise<ComplianceControl | null> {
    const row = await prisma.complianceControl.findUnique({ where: { controlId } });
    return row ? toEntity(row) : null;
  },
};

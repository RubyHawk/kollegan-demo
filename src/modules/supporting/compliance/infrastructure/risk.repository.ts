import { prisma } from '@core/database/prisma';
import type { ComplianceRisk, CreateRiskInput, UpdateRiskInput } from '../domain/risk.entity';

type RiskRow = {
  id: string; organizationId: string; asset: string; threat: string;
  vulnerability: string; likelihood: number; impact: number; riskScore: number;
  treatment: string; treatmentDesc: string | null; owner: string | null;
  dueDate: Date | null; status: string; createdAt: Date; updatedAt: Date;
  createdBy: string; deletedAt: Date | null;
};

function toEntity(raw: RiskRow): ComplianceRisk {
  return {
    id:             raw.id,
    organizationId: raw.organizationId,
    asset:          raw.asset,
    threat:         raw.threat,
    vulnerability:  raw.vulnerability,
    likelihood:     raw.likelihood,
    impact:         raw.impact,
    riskScore:      raw.riskScore,
    treatment:      raw.treatment as ComplianceRisk['treatment'],
    treatmentDesc:  raw.treatmentDesc,
    owner:          raw.owner,
    dueDate:        raw.dueDate,
    status:         raw.status as ComplianceRisk['status'],
    createdAt:      raw.createdAt,
    updatedAt:      raw.updatedAt,
    createdBy:      raw.createdBy,
  };
}

export const riskRepository = {
  async create(input: CreateRiskInput & { riskScore: number }): Promise<ComplianceRisk> {
    const raw = await prisma.complianceRisk.create({
      data: {
        organizationId: input.organizationId,
        asset:          input.asset,
        threat:         input.threat,
        vulnerability:  input.vulnerability,
        likelihood:     input.likelihood,
        impact:         input.impact,
        riskScore:      input.riskScore,
        treatment:      input.treatment,
        treatmentDesc:  input.treatmentDesc ?? null,
        owner:          input.owner ?? null,
        dueDate:        input.dueDate ?? null,
        createdBy:      input.createdBy,
      },
    });
    return toEntity(raw as RiskRow);
  },

  async findById(id: string, organizationId: string): Promise<ComplianceRisk | null> {
    const raw = await prisma.complianceRisk.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return raw ? toEntity(raw as RiskRow) : null;
  },

  async list(
    organizationId: string,
    options: { status?: string; limit?: number; offset?: number } = {}
  ): Promise<{ items: ComplianceRisk[]; total: number }> {
    const where = {
      organizationId,
      deletedAt: null,
      ...(options.status ? { status: options.status } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.complianceRisk.findMany({
        where,
        orderBy: { riskScore: 'desc' },
        take:    options.limit  ?? 50,
        skip:    options.offset ?? 0,
      }),
      prisma.complianceRisk.count({ where }),
    ]);
    return { items: (rows as RiskRow[]).map(toEntity), total };
  },

  async update(id: string, organizationId: string, data: UpdateRiskInput & { riskScore?: number }): Promise<ComplianceRisk | null> {
    const existing = await prisma.complianceRisk.findFirst({ where: { id, organizationId, deletedAt: null } });
    if (!existing) return null;
    const raw = await prisma.complianceRisk.update({ where: { id }, data });
    return toEntity(raw as RiskRow);
  },

  async softDelete(id: string, organizationId: string): Promise<boolean> {
    const existing = await prisma.complianceRisk.findFirst({ where: { id, organizationId, deletedAt: null } });
    if (!existing) return false;
    await prisma.complianceRisk.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  },
};

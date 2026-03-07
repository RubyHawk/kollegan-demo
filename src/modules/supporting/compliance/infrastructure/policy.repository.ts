import { prisma } from '@platform/database/prisma';
import type { CompliancePolicy, CreatePolicyInput, UpdatePolicyInput } from '../domain/policy.entity';

type PolicyRow = {
  id: string; organizationId: string; name: string; category: string;
  version: string; content: string; reviewCycleDays: number;
  nextReviewDate: Date | null; owner: string | null;
  approvedAt: Date | null; approvedBy: string | null;
  status: string; createdAt: Date; updatedAt: Date; createdBy: string; deletedAt: Date | null;
};

function toEntity(raw: PolicyRow): CompliancePolicy {
  return {
    id:              raw.id,
    organizationId:  raw.organizationId,
    name:            raw.name,
    category:        raw.category,
    version:         raw.version,
    content:         raw.content,
    reviewCycleDays: raw.reviewCycleDays,
    nextReviewDate:  raw.nextReviewDate,
    owner:           raw.owner,
    approvedAt:      raw.approvedAt,
    approvedBy:      raw.approvedBy,
    status:          raw.status as CompliancePolicy['status'],
    createdAt:       raw.createdAt,
    updatedAt:       raw.updatedAt,
    createdBy:       raw.createdBy,
  };
}

export const policyRepository = {
  async create(input: CreatePolicyInput): Promise<CompliancePolicy> {
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + (input.reviewCycleDays ?? 365));
    const raw = await prisma.compliancePolicy.create({
      data: {
        organizationId:  input.organizationId,
        name:            input.name,
        category:        input.category,
        content:         input.content,
        version:         input.version ?? '1.0',
        reviewCycleDays: input.reviewCycleDays ?? 365,
        nextReviewDate,
        owner:           input.owner ?? null,
        createdBy:       input.createdBy,
      },
    });
    return toEntity(raw as PolicyRow);
  },

  async findById(id: string, organizationId: string): Promise<CompliancePolicy | null> {
    const raw = await prisma.compliancePolicy.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return raw ? toEntity(raw as PolicyRow) : null;
  },

  async list(
    organizationId: string,
    options: { status?: string; limit?: number; offset?: number } = {}
  ): Promise<{ items: CompliancePolicy[]; total: number }> {
    const where = {
      organizationId,
      deletedAt: null,
      ...(options.status ? { status: options.status } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.compliancePolicy.findMany({
        where,
        orderBy: { name: 'asc' },
        take:    options.limit  ?? 50,
        skip:    options.offset ?? 0,
      }),
      prisma.compliancePolicy.count({ where }),
    ]);
    return { items: (rows as PolicyRow[]).map(toEntity), total };
  },

  async update(id: string, organizationId: string, data: UpdatePolicyInput): Promise<CompliancePolicy | null> {
    const existing = await prisma.compliancePolicy.findFirst({ where: { id, organizationId, deletedAt: null } });
    if (!existing) return null;
    const raw = await prisma.compliancePolicy.update({ where: { id }, data });
    return toEntity(raw as PolicyRow);
  },

  async softDelete(id: string, organizationId: string): Promise<boolean> {
    const existing = await prisma.compliancePolicy.findFirst({ where: { id, organizationId, deletedAt: null } });
    if (!existing) return false;
    await prisma.compliancePolicy.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  },
};

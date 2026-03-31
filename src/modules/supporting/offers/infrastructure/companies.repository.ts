import { prisma } from '@platform/database/prisma';
import type { Company } from '../domain/offer.entity';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CreateCompanyInput {
  organizationId: string;
  name:           string;
  orgNumber?:     string;
  website?:       string;
  logoUrl?:       string;
  industry?:      string;
  notes?:         string;
  createdBy:      string;
}

export interface UpdateCompanyInput {
  name?:      string;
  orgNumber?: string;
  website?:   string;
  logoUrl?:   string;
  industry?:  string;
  notes?:     string;
}

// ─── Mapper ────────────────────────────────────────────────────────────────────

function mapCompany(r: Record<string, unknown>): Company {
  return {
    id:             r.id as string,
    organizationId: r.organizationId as string,
    name:           r.name as string,
    orgNumber:      (r.orgNumber as string | null) ?? undefined,
    website:        (r.website as string | null) ?? undefined,
    logoUrl:        (r.logoUrl as string | null) ?? undefined,
    industry:       (r.industry as string | null) ?? undefined,
    notes:          (r.notes as string | null) ?? undefined,
    createdBy:      r.createdBy as string,
    createdAt:      (r.createdAt as Date).toISOString(),
    updatedAt:      (r.updatedAt as Date).toISOString(),
  };
}

const COMPANY_SELECT = {
  id: true, organizationId: true, name: true, orgNumber: true,
  website: true, logoUrl: true, industry: true, notes: true,
  createdBy: true, createdAt: true, updatedAt: true,
};

// ─── Repository ────────────────────────────────────────────────────────────────

export const companiesRepository = {

  async list(orgId: string, search?: string): Promise<Company[]> {
    const rows = await prisma.company.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      select: COMPANY_SELECT,
      orderBy: { name: 'asc' },
    });
    return rows.map((r: unknown) => mapCompany(r as Record<string, unknown>));
  },

  async getById(id: string, orgId: string): Promise<Company | null> {
    const row = await prisma.company.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: COMPANY_SELECT,
    });
    return row ? mapCompany(row as unknown as Record<string, unknown>) : null;
  },

  async create(input: CreateCompanyInput): Promise<Company> {
    const row = await prisma.company.create({
      data: {
        organizationId: input.organizationId,
        name:           input.name,
        orgNumber:      input.orgNumber ?? null,
        website:        input.website ?? null,
        logoUrl:        input.logoUrl ?? null,
        industry:       input.industry ?? null,
        notes:          input.notes ?? null,
        createdBy:      input.createdBy,
      },
      select: COMPANY_SELECT,
    });
    return mapCompany(row as unknown as Record<string, unknown>);
  },

  async update(id: string, orgId: string, input: UpdateCompanyInput): Promise<Company | null> {
    const existing = await prisma.company.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return null;
    const row = await prisma.company.update({
      where: { id },
      data: {
        ...(input.name      !== undefined ? { name: input.name }           : {}),
        ...(input.orgNumber !== undefined ? { orgNumber: input.orgNumber } : {}),
        ...(input.website   !== undefined ? { website: input.website }     : {}),
        ...(input.logoUrl   !== undefined ? { logoUrl: input.logoUrl }     : {}),
        ...(input.industry  !== undefined ? { industry: input.industry }   : {}),
        ...(input.notes     !== undefined ? { notes: input.notes }         : {}),
      },
      select: COMPANY_SELECT,
    });
    return mapCompany(row as unknown as Record<string, unknown>);
  },

  async delete(id: string, orgId: string): Promise<boolean> {
    const existing = await prisma.company.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return false;
    await prisma.company.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  },
};

import { prisma } from '@platform/database/prisma';
import type { Company, CompanyMember } from '../domain/offer.entity';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CreateCompanyInput {
  organizationId: string;
  name:           string;
  orgNumber?:     string;
  website?:       string;
  logoUrl?:       string;
  senderEmail?:   string;
  senderName?:    string;
  emailHeaderConfig?: string;
  industry?:      string;
  notes?:         string;
  createdBy:      string;
}

export interface UpdateCompanyInput {
  name?:      string;
  orgNumber?: string;
  website?:   string;
  logoUrl?:   string;
  senderEmail?: string;
  senderName?: string;
  emailHeaderConfig?: string;
  industry?:  string;
  notes?:     string;
}

export interface UpsertCompanyMemberInput {
  companyId: string;
  organizationId: string;
  userId: string;
  role: 'staff' | 'admin';
  grantedBy?: string;
}

interface CompanyListOptions {
  userId?: string;
  restrictToMemberships?: boolean;
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
    senderEmail:    (r.senderEmail as string | null) ?? undefined,
    senderName:     (r.senderName as string | null) ?? undefined,
    emailHeaderConfig: (r.emailHeaderConfig as string | null) ?? undefined,
    industry:       (r.industry as string | null) ?? undefined,
    notes:          (r.notes as string | null) ?? undefined,
    createdBy:      r.createdBy as string,
    createdAt:      (r.createdAt as Date).toISOString(),
    updatedAt:      (r.updatedAt as Date).toISOString(),
  };
}

const COMPANY_SELECT = {
  id: true, organizationId: true, name: true, orgNumber: true,
  website: true, logoUrl: true, senderEmail: true, senderName: true, emailHeaderConfig: true, industry: true, notes: true,
  createdBy: true, createdAt: true, updatedAt: true,
};

function mapCompanyMember(row: {
  id: string;
  companyId: string;
  userId: string;
  role: string;
  createdAt: Date;
  grantedBy: string | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}): CompanyMember {
  return {
    id: row.id,
    companyId: row.companyId,
    userId: row.userId,
    role: row.role as 'staff' | 'admin',
    createdAt: row.createdAt.toISOString(),
    grantedBy: row.grantedBy ?? undefined,
    user: {
      id: row.user.id,
      email: row.user.email,
      firstName: row.user.firstName ?? undefined,
      lastName: row.user.lastName ?? undefined,
      avatarUrl: row.user.avatarUrl ?? undefined,
    },
  };
}

// ─── Repository ────────────────────────────────────────────────────────────────

export const companiesRepository = {

  async list(orgId: string, search?: string, options: CompanyListOptions = {}): Promise<Company[]> {
    let allowedCompanyIds: string[] | undefined;

    if (options.restrictToMemberships && options.userId) {
      const memberships = await prisma.companyMember.findMany({
        where: {
          userId: options.userId,
          company: { organizationId: orgId, deletedAt: null },
        },
        select: { companyId: true },
      });

      allowedCompanyIds = memberships.map((membership) => membership.companyId);
      if (allowedCompanyIds.length === 0) {
        return [];
      }
    }

    const rows = await prisma.company.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        ...(allowedCompanyIds ? { id: { in: allowedCompanyIds } } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      select: COMPANY_SELECT,
      orderBy: { name: 'asc' },
    });
    return rows.map((r: unknown) => mapCompany(r as Record<string, unknown>));
  },

  async getById(id: string, orgId: string, options: CompanyListOptions = {}): Promise<Company | null> {
    let allowedCompanyIds: string[] | undefined;

    if (options.restrictToMemberships && options.userId) {
      const memberships = await prisma.companyMember.findMany({
        where: {
          userId: options.userId,
          company: { organizationId: orgId, deletedAt: null },
        },
        select: { companyId: true },
      });

      allowedCompanyIds = memberships.map((membership) => membership.companyId);
      if (allowedCompanyIds.length === 0) {
        return null;
      }
    }

    const row = await prisma.company.findFirst({
      where: {
        id,
        organizationId: orgId,
        deletedAt: null,
        ...(allowedCompanyIds ? { id: { in: allowedCompanyIds } } : {}),
      },
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
        senderEmail:    input.senderEmail ?? null,
        senderName:     input.senderName ?? null,
        emailHeaderConfig: input.emailHeaderConfig ?? null,
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
        ...(input.senderEmail !== undefined ? { senderEmail: input.senderEmail } : {}),
        ...(input.senderName !== undefined ? { senderName: input.senderName } : {}),
        ...(input.emailHeaderConfig !== undefined ? { emailHeaderConfig: input.emailHeaderConfig } : {}),
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

  async listMembers(companyId: string, orgId: string): Promise<CompanyMember[]> {
    const company = await prisma.company.findFirst({
      where: { id: companyId, organizationId: orgId, deletedAt: null },
      select: { id: true },
    });
    if (!company) return [];

    const rows = await prisma.companyMember.findMany({
      where: { companyId },
      orderBy: [{ role: 'desc' }, { createdAt: 'asc' }],
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
    return rows.map(mapCompanyMember);
  },

  async getMember(companyId: string, userId: string): Promise<CompanyMember | null> {
    const row = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return row ? mapCompanyMember(row) : null;
  },

  async listAssignableUsers(orgId: string) {
    return prisma.user.findMany({
      where: { organizationId: orgId, deletedAt: null, userType: 'staff', isActive: true },
      orderBy: [{ firstName: 'asc' }, { email: 'asc' }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });
  },

  async upsertMember(input: UpsertCompanyMemberInput): Promise<CompanyMember> {
    const company = await prisma.company.findFirst({
      where: { id: input.companyId, organizationId: input.organizationId, deletedAt: null },
      select: { id: true, organizationId: true },
    });
    if (!company) {
      throw new Error('COMPANY_NOT_FOUND');
    }

    const user = await prisma.user.findFirst({
      where: { id: input.userId, organizationId: input.organizationId, deletedAt: null, userType: 'staff' },
      select: { id: true },
    });
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const row = await prisma.companyMember.upsert({
      where: {
        companyId_userId: {
          companyId: input.companyId,
          userId: input.userId,
        },
      },
      create: {
        companyId: input.companyId,
        userId: input.userId,
        role: input.role,
        grantedBy: input.grantedBy ?? null,
      },
      update: {
        role: input.role,
        grantedBy: input.grantedBy ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
    return mapCompanyMember(row);
  },

  async removeMember(companyId: string, orgId: string, userId: string): Promise<boolean> {
    const company = await prisma.company.findFirst({
      where: { id: companyId, organizationId: orgId, deletedAt: null },
      select: { id: true },
    });
    if (!company) return false;

    const existing = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
      select: { id: true },
    });

    if (!existing) return false;

    await prisma.companyMember.delete({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
    });
    return true;
  },
};

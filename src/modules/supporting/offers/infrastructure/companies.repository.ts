import { prisma } from '@platform/database/prisma';
import { logger } from '@platform/logging/logger';
import type { Company, CompanyMember } from '../domain/offer.entity';

const TAG = 'CompaniesRepository';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CreateCompanyInput {
  organizationId: string;
  name:           string;
  orgNumber?:     string;
  addressLine1?:  string;
  addressLine2?:  string;
  postalCode?:    string;
  city?:          string;
  region?:        string;
  country?:       string;
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
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  region?: string;
  country?: string;
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
    addressLine1:   (r.addressLine1 as string | null) ?? undefined,
    addressLine2:   (r.addressLine2 as string | null) ?? undefined,
    postalCode:     (r.postalCode as string | null) ?? undefined,
    city:           (r.city as string | null) ?? undefined,
    region:         (r.region as string | null) ?? undefined,
    country:        (r.country as string | null) ?? undefined,
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
  addressLine1: true, addressLine2: true, postalCode: true, city: true, region: true, country: true,
  website: true, logoUrl: true, senderEmail: true, senderName: true, emailHeaderConfig: true, industry: true, notes: true,
  createdBy: true, createdAt: true, updatedAt: true,
};

const COMPANY_SELECT_LEGACY = {
  id: true, organizationId: true, name: true, orgNumber: true,
  website: true, logoUrl: true, senderEmail: true, senderName: true, emailHeaderConfig: true, industry: true, notes: true,
  createdBy: true, createdAt: true, updatedAt: true,
};

function isMissingAddressColumnError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes('p2022') ||
    message.includes('unknown field `addressline1`') ||
    message.includes('unknown field `addressline2`') ||
    message.includes('unknown field `postalcode`') ||
    message.includes('unknown field `city`') ||
    message.includes('unknown field `region`') ||
    message.includes('unknown field `country`') ||
    message.includes('unknown argument `addressline1`') ||
    message.includes('unknown argument `addressline2`') ||
    message.includes('unknown argument `postalcode`') ||
    message.includes('unknown argument `city`') ||
    message.includes('unknown argument `region`') ||
    message.includes('unknown argument `country`') ||
    (
      message.includes('does not exist') &&
      ['addressline1', 'addressline2', 'postalcode', 'city', 'region', 'country'].some((field) => message.includes(field))
    )
  );
}

function isMissingCompanyMembershipError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes('p2021') ||
    message.includes('p2022') ||
    message.includes('off_company_members') ||
    message.includes('companymember') ||
    message.includes('unknown table') ||
    message.includes('does not exist')
  );
}

async function withCompanySelectFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    if (!isMissingAddressColumnError(error)) {
      throw error;
    }
    return fallback();
  }
}

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
      try {
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
      } catch (error) {
        if (!isMissingCompanyMembershipError(error)) {
          throw error;
        }
        logger.warn(TAG, 'Company membership table unavailable during list, falling back to org-wide company list', {
          orgId,
          userId: options.userId,
        });
      }
    }

    const where = {
      organizationId: orgId,
      deletedAt: null,
      ...(allowedCompanyIds ? { id: { in: allowedCompanyIds } } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };
    const rows = await withCompanySelectFallback(
      () => prisma.company.findMany({
        where,
        select: COMPANY_SELECT,
        orderBy: { name: 'asc' },
      }),
      () => prisma.company.findMany({
        where,
        select: COMPANY_SELECT_LEGACY,
        orderBy: { name: 'asc' },
      }),
    );
    return rows.map((r: unknown) => mapCompany(r as Record<string, unknown>));
  },

  async getById(id: string, orgId: string, options: CompanyListOptions = {}): Promise<Company | null> {
    let allowedCompanyIds: string[] | undefined;

    if (options.restrictToMemberships && options.userId) {
      try {
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
      } catch (error) {
        if (!isMissingCompanyMembershipError(error)) {
          throw error;
        }
        logger.warn(TAG, 'Company membership table unavailable during getById, falling back to org-wide company access', {
          companyId: id,
          orgId,
          userId: options.userId,
        });
      }
    }

    const where = {
      id,
      organizationId: orgId,
      deletedAt: null,
      ...(allowedCompanyIds ? { id: { in: allowedCompanyIds } } : {}),
    };
    const row = await withCompanySelectFallback(
      () => prisma.company.findFirst({
        where,
        select: COMPANY_SELECT,
      }),
      () => prisma.company.findFirst({
        where,
        select: COMPANY_SELECT_LEGACY,
      }),
    );
    return row ? mapCompany(row as unknown as Record<string, unknown>) : null;
  },

  async create(input: CreateCompanyInput): Promise<Company> {
    const data = {
      organizationId: input.organizationId,
      name:           input.name,
      orgNumber:      input.orgNumber ?? null,
      addressLine1:   input.addressLine1 ?? null,
      addressLine2:   input.addressLine2 ?? null,
      postalCode:     input.postalCode ?? null,
      city:           input.city ?? null,
      region:         input.region ?? null,
      country:        input.country ?? null,
      website:        input.website ?? null,
      logoUrl:        input.logoUrl ?? null,
      senderEmail:    input.senderEmail ?? null,
      senderName:     input.senderName ?? null,
      emailHeaderConfig: input.emailHeaderConfig ?? null,
      industry:       input.industry ?? null,
      notes:          input.notes ?? null,
      createdBy:      input.createdBy,
    } as Parameters<typeof prisma.company.create>[0]['data'];

    const legacyData = {
      organizationId: input.organizationId,
      name: input.name,
      orgNumber: input.orgNumber ?? null,
      website: input.website ?? null,
      logoUrl: input.logoUrl ?? null,
      senderEmail: input.senderEmail ?? null,
      senderName: input.senderName ?? null,
      emailHeaderConfig: input.emailHeaderConfig ?? null,
      industry: input.industry ?? null,
      notes: input.notes ?? null,
      createdBy: input.createdBy,
    } as Parameters<typeof prisma.company.create>[0]['data'];

    const row = await withCompanySelectFallback(
      () => prisma.company.create({
        data,
        select: COMPANY_SELECT,
      }),
      () => prisma.company.create({
        data: legacyData,
        select: COMPANY_SELECT_LEGACY,
      }),
    );
    return mapCompany(row as unknown as Record<string, unknown>);
  },

  async update(id: string, orgId: string, input: UpdateCompanyInput): Promise<Company | null> {
    const existing = await prisma.company.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return null;
    const data = {
      ...(input.name      !== undefined ? { name: input.name }           : {}),
      ...(input.orgNumber !== undefined ? { orgNumber: input.orgNumber } : {}),
      ...(input.addressLine1 !== undefined ? { addressLine1: input.addressLine1 } : {}),
      ...(input.addressLine2 !== undefined ? { addressLine2: input.addressLine2 } : {}),
      ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.website   !== undefined ? { website: input.website }     : {}),
      ...(input.logoUrl   !== undefined ? { logoUrl: input.logoUrl }     : {}),
      ...(input.senderEmail !== undefined ? { senderEmail: input.senderEmail } : {}),
      ...(input.senderName !== undefined ? { senderName: input.senderName } : {}),
      ...(input.emailHeaderConfig !== undefined ? { emailHeaderConfig: input.emailHeaderConfig } : {}),
      ...(input.industry  !== undefined ? { industry: input.industry }   : {}),
      ...(input.notes     !== undefined ? { notes: input.notes }         : {}),
    } as Parameters<typeof prisma.company.update>[0]['data'];

    const legacyData = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.orgNumber !== undefined ? { orgNumber: input.orgNumber } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      ...(input.senderEmail !== undefined ? { senderEmail: input.senderEmail } : {}),
      ...(input.senderName !== undefined ? { senderName: input.senderName } : {}),
      ...(input.emailHeaderConfig !== undefined ? { emailHeaderConfig: input.emailHeaderConfig } : {}),
      ...(input.industry !== undefined ? { industry: input.industry } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    } as Parameters<typeof prisma.company.update>[0]['data'];

    const row = await withCompanySelectFallback(
      () => prisma.company.update({
        where: { id },
        data,
        select: COMPANY_SELECT,
      }),
      () => prisma.company.update({
        where: { id },
        data: legacyData,
        select: COMPANY_SELECT_LEGACY,
      }),
    );
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

    let rows;
    try {
      rows = await prisma.companyMember.findMany({
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
    } catch (error) {
      if (!isMissingCompanyMembershipError(error)) {
        throw error;
      }
      logger.warn(TAG, 'Company membership table unavailable during listMembers, returning empty members', { companyId, orgId });
      return [];
    }
    return rows.map(mapCompanyMember);
  },

  async getMember(companyId: string, userId: string): Promise<CompanyMember | null> {
    try {
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
    } catch (error) {
      if (!isMissingCompanyMembershipError(error)) {
        throw error;
      }

      const [company, user] = await Promise.all([
        prisma.company.findFirst({
          where: { id: companyId, deletedAt: null },
          select: { id: true, organizationId: true, createdAt: true, createdBy: true },
        }),
        prisma.user.findFirst({
          where: { id: userId, deletedAt: null, isActive: true },
          select: { id: true, organizationId: true, email: true, firstName: true, lastName: true, avatarUrl: true },
        }),
      ]);

      if (!company || !user || company.organizationId !== user.organizationId) {
        return null;
      }

      logger.warn(TAG, 'Company membership table unavailable during getMember, using org-level synthetic company membership', {
        companyId,
        userId,
      });

      return {
        id: `synthetic:${companyId}:${userId}`,
        companyId,
        userId,
        role: 'admin',
        createdAt: company.createdAt.toISOString(),
        grantedBy: company.createdBy,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName ?? undefined,
          lastName: user.lastName ?? undefined,
          avatarUrl: user.avatarUrl ?? undefined,
        },
      };
    }
  },

  async listAssignableUsers(orgId: string) {
    return prisma.user.findMany({
      where: { organizationId: orgId, deletedAt: null, isActive: true },
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
      where: { id: input.userId, organizationId: input.organizationId, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    try {
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
    } catch (error) {
      if (!isMissingCompanyMembershipError(error)) {
        throw error;
      }

      const userDetails = await prisma.user.findFirst({
        where: { id: input.userId, organizationId: input.organizationId, deletedAt: null, isActive: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      });

      if (!userDetails) {
        throw new Error('USER_NOT_FOUND');
      }

      logger.warn(TAG, 'Company membership table unavailable during upsertMember, returning synthetic membership', {
        companyId: input.companyId,
        userId: input.userId,
        role: input.role,
      });

      return {
        id: `synthetic:${input.companyId}:${input.userId}`,
        companyId: input.companyId,
        userId: input.userId,
        role: input.role,
        createdAt: new Date().toISOString(),
        grantedBy: input.grantedBy,
        user: {
          id: userDetails.id,
          email: userDetails.email,
          firstName: userDetails.firstName ?? undefined,
          lastName: userDetails.lastName ?? undefined,
          avatarUrl: userDetails.avatarUrl ?? undefined,
        },
      };
    }
  },

  async removeMember(companyId: string, orgId: string, userId: string): Promise<boolean> {
    const company = await prisma.company.findFirst({
      where: { id: companyId, organizationId: orgId, deletedAt: null },
      select: { id: true },
    });
    if (!company) return false;

    let existing;
    try {
      existing = await prisma.companyMember.findUnique({
        where: {
          companyId_userId: {
            companyId,
            userId,
          },
        },
        select: { id: true },
      });
    } catch (error) {
      if (!isMissingCompanyMembershipError(error)) {
        throw error;
      }
      logger.warn(TAG, 'Company membership table unavailable during removeMember', { companyId, orgId, userId });
      return false;
    }

    if (!existing) return false;

    try {
      await prisma.companyMember.delete({
        where: {
          companyId_userId: {
            companyId,
            userId,
          },
        },
      });
    } catch (error) {
      if (!isMissingCompanyMembershipError(error)) {
        throw error;
      }
      logger.warn(TAG, 'Company membership table unavailable during deleteMember', { companyId, orgId, userId });
      return false;
    }
    return true;
  },
};

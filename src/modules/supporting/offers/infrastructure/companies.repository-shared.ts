import type { Company, CompanyMember } from '../domain/offer.entity';

export function mapCompany(r: Record<string, unknown>): Company {
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
    customFields:   (r.customFields as Record<string, unknown> | null) ?? undefined,
    createdBy:      r.createdBy as string,
    createdAt:      (r.createdAt as Date).toISOString(),
    updatedAt:      (r.updatedAt as Date).toISOString(),
  };
}

export const COMPANY_SELECT = {
  id: true, organizationId: true, name: true, orgNumber: true,
  addressLine1: true, addressLine2: true, postalCode: true, city: true, region: true, country: true,
  website: true, logoUrl: true, senderEmail: true, senderName: true, emailHeaderConfig: true, industry: true, notes: true,
  customFields: true,
  createdBy: true, createdAt: true, updatedAt: true,
};

export const COMPANY_SELECT_LEGACY = {
  id: true, organizationId: true, name: true, orgNumber: true,
  website: true, logoUrl: true, senderEmail: true, senderName: true, emailHeaderConfig: true, industry: true, notes: true,
  createdBy: true, createdAt: true, updatedAt: true,
};

export function isMissingAddressColumnError(error: unknown): boolean {
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

export function isMissingCompanyMembershipError(error: unknown): boolean {
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

export async function withCompanySelectFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    if (!isMissingAddressColumnError(error)) {
      throw error;
    }
    return fallback();
  }
}

export function mapCompanyMember(row: {
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

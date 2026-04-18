import { prisma } from '@platform/database/prisma';
import type { Customer, CustomerInput, UpdateCustomerInput } from '../domain/customer.entity';

export interface ListCustomersFilter {
  search?: string;
  limit?: number;
  offset?: number;
}

function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    organizationId: row.organizationId as string,
    name: row.name as string,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    company: (row.company as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    postalCode: (row.postalCode as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    convertedFromLeadId: (row.convertedFromLeadId as string | null) ?? null,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  };
}

function normalizeEmail(email?: string | null): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed || null;
}

export const customersRepository = {
  async findById(id: string, orgId: string): Promise<Customer | null> {
    const row = await prisma.customer.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    return row ? mapCustomer(row as unknown as Record<string, unknown>) : null;
  },

  async findByEmail(orgId: string, email?: string | null): Promise<Customer | null> {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    const row = await prisma.customer.findFirst({
      where: { organizationId: orgId, email: normalized, deletedAt: null },
    });
    return row ? mapCustomer(row as unknown as Record<string, unknown>) : null;
  },

  async list(orgId: string, filter: ListCustomersFilter): Promise<{ customers: Customer[]; total: number }> {
    const where = {
      organizationId: orgId,
      deletedAt: null,
      ...(filter.search ? {
        OR: [
          { name: { contains: filter.search, mode: 'insensitive' as const } },
          { email: { contains: filter.search, mode: 'insensitive' as const } },
          { phone: { contains: filter.search, mode: 'insensitive' as const } },
          { company: { contains: filter.search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filter.limit ?? 50,
        skip: filter.offset ?? 0,
      }),
      prisma.customer.count({ where }),
    ]);
    return { customers: (rows as unknown as Record<string, unknown>[]).map(mapCustomer), total };
  },

  async create(input: CustomerInput): Promise<Customer> {
    const row = await prisma.customer.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        email: normalizeEmail(input.email),
        phone: input.phone ?? null,
        company: input.company ?? null,
        address: input.address ?? null,
        postalCode: input.postalCode ?? null,
        city: input.city ?? null,
        country: input.country ?? 'SE',
        notes: input.notes ?? null,
        convertedFromLeadId: input.convertedFromLeadId ?? null,
      },
    });
    return mapCustomer(row as unknown as Record<string, unknown>);
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const existing = await prisma.customer.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return false;
    await prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  },

  async update(id: string, orgId: string, input: UpdateCustomerInput): Promise<Customer | null> {
    const existing = await prisma.customer.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return null;
    const row = await prisma.customer.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: normalizeEmail(input.email) } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.company !== undefined ? { company: input.company } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });
    return mapCustomer(row as unknown as Record<string, unknown>);
  },

  async getLead(leadId: string, orgId: string) {
    return prisma.lead.findFirst({ where: { id: leadId, organizationId: orgId, deletedAt: null } });
  },

  async linkLeadToCustomer(leadId: string, orgId: string, customerId: string): Promise<void> {
    await prisma.lead.updateMany({
      where: { id: leadId, organizationId: orgId, deletedAt: null },
      data: { customerId, status: 'won', convertedAt: new Date() },
    });
  },

  async linkOfferToCustomer(offerId: string, orgId: string, customerId: string): Promise<void> {
    await prisma.offer.updateMany({
      where: { id: offerId, organizationId: orgId, deletedAt: null },
      data: { customerId },
    });
  },
};

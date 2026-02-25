import { prisma } from '@/lib/prisma';

export interface CustomerLookupResult {
  found: boolean;
  customer: Awaited<ReturnType<typeof findCustomer>> | null;
}

async function findCustomer(params: { phone?: string; name?: string }) {
  return prisma.customer.findFirst({
    where: params.phone
      ? { phone: params.phone }
      : { name: { contains: params.name!, mode: 'insensitive' } },
    include: {
      bookings:    { orderBy: { createdAt: 'desc' }, take: 10 },
      transcripts: { orderBy: { startedAt: 'desc' }, take: 5 },
    },
  });
}

/**
 * Looks up a customer by phone number or name.
 * Returns found=false if neither is provided or no match exists.
 */
export async function lookupCustomer(params: {
  phone?: string;
  name?: string;
}): Promise<CustomerLookupResult> {
  if (!params.phone && !params.name) {
    return { found: false, customer: null };
  }

  const customer = await findCustomer(params);
  return { found: !!customer, customer };
}

/**
 * Creates or updates a customer record.
 * Uses phone as the unique key when available, falls back to email.
 * Increments callCount on each upsert.
 */
export async function upsertCustomer(data: {
  phone?: string;
  name?: string;
  email?: string;
  company?: string;
  notes?: string;
}) {
  // No unique key available — create a new record
  if (!data.phone && !data.email) {
    return prisma.customer.create({
      data: { ...data, callCount: 1 },
    });
  }

  // Upsert by phone (preferred) or email
  const whereKey = data.phone ? { phone: data.phone } : { phone: data.email ?? '' };

  return prisma.customer.upsert({
    where:  whereKey,
    create: { ...data, callCount: 1 },
    update: {
      name:      data.name      ?? undefined,
      email:     data.email     ?? undefined,
      company:   data.company   ?? undefined,
      notes:     data.notes     ?? undefined,
      callCount: { increment: 1 },
    },
  });
}

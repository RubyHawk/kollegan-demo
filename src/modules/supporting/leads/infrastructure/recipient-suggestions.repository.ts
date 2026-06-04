import { prisma } from '@platform/database/prisma';

export type RecipientSuggestionKind = 'customer' | 'lead';

export interface RecipientSuggestion {
  id: string;
  kind: RecipientSuggestionKind;
  label: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  companyId: string | null;
  leadId: string | null;
  customerId: string | null;
  address: string | null;
  postalCode: string | null;
  requestedService: string | null;
  sourceLabel: string | null;
  hasOffer: boolean;
  createdAt: string;
}

export async function listRecipientSuggestions(input: {
  organizationId: string;
  search: string;
  companyIds?: string[];
  includeLegacyCompanyless?: boolean;
  limit: number;
}): Promise<RecipientSuggestion[]> {
  const query = input.search.trim();
  if (!query) return [];

  const companyWhere = input.companyIds
    ? {
        OR: [
          { companyId: { in: input.companyIds } },
          ...(input.includeLegacyCompanyless ? [{ companyId: null }] : []),
        ],
      }
    : {};

  const [customers, leads] = await Promise.all([
    prisma.customer.findMany({
      where: {
        organizationId: input.organizationId,
        deletedAt: null,
        ...companyWhere,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: input.limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        companyId: true,
        address: true,
        postalCode: true,
        createdAt: true,
        offers: { select: { id: true }, take: 1 },
      },
    }),
    prisma.lead.findMany({
      where: {
        organizationId: input.organizationId,
        deletedAt: null,
        status: { notIn: ['won', 'lost'] },
        ...companyWhere,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
          { requestedService: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: input.limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        companyId: true,
        customerId: true,
        address: true,
        postalCode: true,
        requestedService: true,
        sourceLabel: true,
        createdAt: true,
      },
    }),
  ]);

  const leadOfferRows = leads.length
    ? await prisma.offer.findMany({
        where: {
          organizationId: input.organizationId,
          deletedAt: null,
          leadId: { in: leads.map((lead) => lead.id) },
        },
        select: { leadId: true },
      })
    : [];
  const leadIdsWithOffers = new Set(leadOfferRows.map((offer) => offer.leadId).filter(Boolean));

  const suggestions: RecipientSuggestion[] = [
    ...leads.map((lead) => ({
      id: `lead:${lead.id}`,
      kind: 'lead' as const,
      label: lead.requestedService ? `${lead.name} - ${lead.requestedService}` : lead.name,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      companyId: lead.companyId,
      leadId: lead.id,
      customerId: lead.customerId,
      address: lead.address,
      postalCode: lead.postalCode,
      requestedService: lead.requestedService,
      sourceLabel: lead.sourceLabel,
      hasOffer: leadIdsWithOffers.has(lead.id),
      createdAt: lead.createdAt.toISOString(),
    })),
    ...customers.map((customer) => ({
      id: `customer:${customer.id}`,
      kind: 'customer' as const,
      label: customer.name,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      companyId: customer.companyId,
      leadId: null,
      customerId: customer.id,
      address: customer.address,
      postalCode: customer.postalCode,
      requestedService: null,
      sourceLabel: null,
      hasOffer: customer.offers.length > 0,
      createdAt: customer.createdAt.toISOString(),
    })),
  ];

  return suggestions
    .sort((a, b) => Number(a.hasOffer) - Number(b.hasOffer) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, input.limit);
}

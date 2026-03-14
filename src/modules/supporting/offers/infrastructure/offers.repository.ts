import { prisma } from '@platform/database/prisma';
import type { Offer, OfferLineItem } from '../domain/offer.entity';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CreateOfferInput {
  organizationId:   string;
  title:            string;
  recipientName:    string;
  recipientEmail:   string;
  recipientCompany?: string;
  notes?:           string;
  validUntil:       Date;
  createdBy:        string;
  leadId?:          string;
  customerId?:      string;
  templateId?:      string;
  generatedDocument?: string;
  lineItems: Array<{
    description: string;
    quantity:    number;
    unitPrice:   number;
    vatRate:     number;
    discount?:   number;
    sortOrder?:  number;
  }>;
}

export interface UpdateOfferInput {
  title?:                string;
  recipientName?:        string;
  recipientEmail?:       string;
  recipientCompany?:     string;
  notes?:                string;
  validUntil?:           Date;
  status?:               string;
  sentAt?:               Date;
  viewedAt?:             Date;
  acceptedAt?:           Date;
  declinedAt?:           Date;
  generatedDocument?:    string;
  signatureImage?:       string;
  publicTokenExpiresAt?: Date;
  lineItems?: Array<{
    id?:         string; // present = update; absent = insert
    description: string;
    quantity:    number;
    unitPrice:   number;
    vatRate:     number;
    discount?:   number;
    sortOrder?:  number;
  }>;
}

export interface ListOffersFilter {
  status?:  string;
  search?:  string;
  leadId?:  string;
  limit?:   number;
  offset?:  number;
}

// ─── Mappers ───────────────────────────────────────────────────────────────────

function mapLineItem(r: Record<string, unknown>): OfferLineItem {
  return {
    id:          r.id as string,
    description: r.description as string,
    quantity:    r.quantity as number,
    unitPrice:   r.unitPrice as number,
    vatRate:     r.vatRate as number,
    discount:    (r.discount as number | null) ?? undefined,
  };
}

function mapOffer(r: Record<string, unknown>): Offer {
  const items = (r.lineItems as Record<string, unknown>[] | undefined) ?? [];
  return {
    id:                   r.id as string,
    title:                r.title as string,
    status:               r.status as Offer['status'],
    recipientName:        r.recipientName as string,
    recipientEmail:       r.recipientEmail as string,
    recipientCompany:     (r.recipientCompany as string | null) ?? undefined,
    notes:                (r.notes as string | null) ?? undefined,
    validUntil:           (r.validUntil as Date).toISOString(),
    createdBy:            r.createdBy as string,
    createdAt:            (r.createdAt as Date).toISOString(),
    sentAt:               r.sentAt ? (r.sentAt as Date).toISOString() : undefined,
    acceptedAt:           r.acceptedAt ? (r.acceptedAt as Date).toISOString() : undefined,
    declinedAt:           r.declinedAt ? (r.declinedAt as Date).toISOString() : undefined,
    leadId:               (r.leadId as string | null) ?? undefined,
    customerId:           (r.customerId as string | null) ?? undefined,
    totalExVat:           r.totalExVat as number,
    totalIncVat:          r.totalIncVat as number,
    templateId:           (r.templateId as string | null) ?? undefined,
    generatedDocument:    (r.generatedDocument as string | null) ?? undefined,
    signatureImage:       (r.signatureImage as string | null) ?? undefined,
    publicToken:          r.publicToken as string,
    publicTokenExpiresAt: r.publicTokenExpiresAt ? (r.publicTokenExpiresAt as Date).toISOString() : undefined,
    lineItems:            items.map(mapLineItem),
  };
}

// ─── Totals calculation ────────────────────────────────────────────────────────

function computeTotals(
  lineItems: Array<{ quantity: number; unitPrice: number; vatRate: number; discount?: number | null }>
): { totalExVat: number; totalIncVat: number } {
  let totalExVat = 0;
  for (const item of lineItems) {
    const discountFactor = 1 - ((item.discount ?? 0) / 100);
    totalExVat += item.quantity * item.unitPrice * discountFactor;
  }
  const vatAmount = lineItems.reduce((sum, item) => {
    const discountFactor = 1 - ((item.discount ?? 0) / 100);
    const lineExVat = item.quantity * item.unitPrice * discountFactor;
    return sum + lineExVat * item.vatRate;
  }, 0);
  return {
    totalExVat:  Math.round(totalExVat * 100) / 100,
    totalIncVat: Math.round((totalExVat + vatAmount) * 100) / 100,
  };
}

const LINE_ITEM_SELECT = {
  id: true, description: true, quantity: true,
  unitPrice: true, vatRate: true, discount: true, sortOrder: true,
};

const OFFER_SELECT = {
  id: true, organizationId: true, title: true, status: true,
  recipientName: true, recipientEmail: true, recipientCompany: true,
  notes: true, validUntil: true, createdBy: true,
  totalExVat: true, totalIncVat: true,
  sentAt: true, viewedAt: true, acceptedAt: true, declinedAt: true,
  leadId: true, customerId: true,
  templateId: true, generatedDocument: true, signatureImage: true,
  publicToken: true, publicTokenExpiresAt: true,
  createdAt: true, updatedAt: true,
  lineItems: { select: LINE_ITEM_SELECT, orderBy: { sortOrder: 'asc' as const } },
};

// ─── Repository ────────────────────────────────────────────────────────────────

export const offersRepository = {

  async create(input: CreateOfferInput): Promise<Offer> {
    const { totalExVat, totalIncVat } = computeTotals(input.lineItems);

    const row = await prisma.offer.create({
      data: {
        organizationId:    input.organizationId,
        title:             input.title,
        recipientName:     input.recipientName,
        recipientEmail:    input.recipientEmail,
        recipientCompany:  input.recipientCompany ?? null,
        notes:             input.notes ?? null,
        validUntil:        input.validUntil,
        createdBy:         input.createdBy,
        leadId:            input.leadId ?? null,
        customerId:        input.customerId ?? null,
        templateId:        input.templateId ?? null,
        generatedDocument: input.generatedDocument ?? null,
        totalExVat,
        totalIncVat,
        lineItems: {
          create: input.lineItems.map((item, idx) => ({
            description: item.description,
            quantity:    item.quantity,
            unitPrice:   item.unitPrice,
            vatRate:     item.vatRate,
            discount:    item.discount ?? 0,
            sortOrder:   item.sortOrder ?? idx,
          })),
        },
      },
      select: OFFER_SELECT,
    });
    return mapOffer(row as unknown as Record<string, unknown>);
  },

  async findById(id: string, orgId: string): Promise<Offer | null> {
    const row = await prisma.offer.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: OFFER_SELECT,
    });
    if (!row) return null;
    return mapOffer(row as unknown as Record<string, unknown>);
  },

  async list(orgId: string, filter: ListOffersFilter): Promise<{ offers: Offer[]; total: number }> {
    const where: Record<string, unknown> = {
      organizationId: orgId,
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.leadId ? { leadId: filter.leadId } : {}),
      ...(filter.search ? {
        OR: [
          { title:         { contains: filter.search, mode: 'insensitive' } },
          { recipientName: { contains: filter.search, mode: 'insensitive' } },
          { recipientEmail:{ contains: filter.search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.offer.findMany({
        where: where as Parameters<typeof prisma.offer.findMany>[0]['where'],
        select: OFFER_SELECT,
        orderBy: { createdAt: 'desc' },
        take:  filter.limit  ?? 50,
        skip:  filter.offset ?? 0,
      }),
      prisma.offer.count({
        where: where as Parameters<typeof prisma.offer.count>[0]['where'],
      }),
    ]);

    return {
      offers: rows.map((r: unknown) => mapOffer(r as Record<string, unknown>)),
      total,
    };
  },

  async update(id: string, orgId: string, input: UpdateOfferInput): Promise<Offer | null> {
    const existing = await prisma.offer.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return null;

    // If line items are being replaced, delete old ones and recreate
    let totals: { totalExVat: number; totalIncVat: number } | undefined;
    if (input.lineItems) {
      totals = computeTotals(input.lineItems);
      await prisma.offerLineItem.deleteMany({ where: { offerId: id } });
    }

    const row = await prisma.offer.update({
      where: { id },
      data: {
        ...(input.title            !== undefined ? { title: input.title }                       : {}),
        ...(input.recipientName    !== undefined ? { recipientName: input.recipientName }       : {}),
        ...(input.recipientEmail   !== undefined ? { recipientEmail: input.recipientEmail }     : {}),
        ...(input.recipientCompany !== undefined ? { recipientCompany: input.recipientCompany } : {}),
        ...(input.notes            !== undefined ? { notes: input.notes }                       : {}),
        ...(input.validUntil       !== undefined ? { validUntil: input.validUntil }             : {}),
        ...(input.status           !== undefined ? { status: input.status }                     : {}),
        ...(input.sentAt               !== undefined ? { sentAt: input.sentAt }                             : {}),
        ...(input.viewedAt             !== undefined ? { viewedAt: input.viewedAt }                         : {}),
        ...(input.acceptedAt           !== undefined ? { acceptedAt: input.acceptedAt }                     : {}),
        ...(input.declinedAt           !== undefined ? { declinedAt: input.declinedAt }                     : {}),
        ...(input.generatedDocument    !== undefined ? { generatedDocument: input.generatedDocument }       : {}),
        ...(input.signatureImage       !== undefined ? { signatureImage: input.signatureImage }             : {}),
        ...(input.publicTokenExpiresAt !== undefined ? { publicTokenExpiresAt: input.publicTokenExpiresAt } : {}),
        ...(totals ? { totalExVat: totals.totalExVat, totalIncVat: totals.totalIncVat } : {}),
        ...(input.lineItems ? {
          lineItems: {
            create: input.lineItems.map((item, idx) => ({
              description: item.description,
              quantity:    item.quantity,
              unitPrice:   item.unitPrice,
              vatRate:     item.vatRate,
              discount:    item.discount ?? 0,
              sortOrder:   item.sortOrder ?? idx,
            })),
          },
        } : {}),
      },
      select: OFFER_SELECT,
    });
    return mapOffer(row as unknown as Record<string, unknown>);
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const existing = await prisma.offer.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return false;
    await prisma.offer.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  },

  // Public route lookup — no orgId needed (token is globally unique)
  async findByPublicToken(token: string): Promise<Offer | null> {
    const row = await prisma.offer.findFirst({
      where:  { publicToken: token, deletedAt: null },
      select: OFFER_SELECT,
    });
    if (!row) return null;
    return mapOffer(row as unknown as Record<string, unknown>);
  },

  // Internal update by id only — used for public signing flow where orgId is not available
  async updateById(id: string, input: UpdateOfferInput): Promise<Offer | null> {
    const existing = await prisma.offer.findFirst({ where: { id, deletedAt: null } });
    if (!existing) return null;

    let totals: { totalExVat: number; totalIncVat: number } | undefined;
    if (input.lineItems) {
      totals = computeTotals(input.lineItems);
      await prisma.offerLineItem.deleteMany({ where: { offerId: id } });
    }

    const row = await prisma.offer.update({
      where: { id },
      data: {
        ...(input.title            !== undefined ? { title: input.title }                                   : {}),
        ...(input.status           !== undefined ? { status: input.status }                                 : {}),
        ...(input.sentAt           !== undefined ? { sentAt: input.sentAt }                                 : {}),
        ...(input.viewedAt         !== undefined ? { viewedAt: input.viewedAt }                             : {}),
        ...(input.acceptedAt       !== undefined ? { acceptedAt: input.acceptedAt }                         : {}),
        ...(input.declinedAt       !== undefined ? { declinedAt: input.declinedAt }                         : {}),
        ...(input.signatureImage   !== undefined ? { signatureImage: input.signatureImage }                 : {}),
        ...(input.generatedDocument !== undefined ? { generatedDocument: input.generatedDocument }          : {}),
        ...(input.publicTokenExpiresAt !== undefined ? { publicTokenExpiresAt: input.publicTokenExpiresAt } : {}),
        ...(totals ? { totalExVat: totals.totalExVat, totalIncVat: totals.totalIncVat } : {}),
        ...(input.lineItems ? {
          lineItems: {
            create: input.lineItems.map((item, idx) => ({
              description: item.description,
              quantity:    item.quantity,
              unitPrice:   item.unitPrice,
              vatRate:     item.vatRate,
              discount:    item.discount ?? 0,
              sortOrder:   item.sortOrder ?? idx,
            })),
          },
        } : {}),
      },
      select: OFFER_SELECT,
    });
    return mapOffer(row as unknown as Record<string, unknown>);
  },
};

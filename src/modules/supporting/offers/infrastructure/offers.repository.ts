import { prisma, Prisma } from '@platform/database/prisma';
import type { Offer } from '../domain/offer.entity';
import { DEFAULT_OFFER_PRICE_DISPLAY_MODE } from '../domain/pricing';
import type { CreateOfferInput, ListOffersFilter, UpdateOfferInput } from './offers.repository-types';
import { computeTotals, mapOffer, OFFER_LIST_SELECT, OFFER_SELECT } from './offers.repository-shared';

export type { CreateOfferInput, ListOffersFilter, UpdateOfferInput } from './offers.repository-types';

export const offersRepository = {

  async create(input: CreateOfferInput): Promise<Offer> {
    const { totalExVat, totalIncVat } = computeTotals(input.lineItems);

    const data = {
        organizationId:    input.organizationId,
        title:             input.title,
        priceDisplayMode:  input.priceDisplayMode ?? DEFAULT_OFFER_PRICE_DISPLAY_MODE,
        recipientName:     input.recipientName,
        recipientEmail:    input.recipientEmail,
        recipientCompany:  input.recipientCompany ?? null,
        notes:             input.notes ?? null,
        validUntil:        input.validUntil,
        validityDays:      input.validityDays,
        createdBy:         input.createdBy,
        leadId:            input.leadId ?? null,
        customerId:        input.customerId ?? null,
        companyId:         input.companyId ?? null,
        templateId:        input.templateId ?? null,
        generatedDocument: input.generatedDocument ?? null,
        generatedPdf:      input.generatedPdf ? Buffer.from(input.generatedPdf) : null,
        generatedPdfFingerprint: input.generatedPdfFingerprint ?? null,
        emailSubject:      input.emailSubject ?? null,
        emailBody:         input.emailBody ?? null,
        emailHeaderConfig: input.emailHeaderConfig ?? null,
        ...(input.customFields !== undefined
          ? { customFields: input.customFields as Prisma.InputJsonValue }
          : {}),
        totalExVat,
        totalIncVat,
        lineItems: {
          create: input.lineItems.map((item, idx) => ({
            description: item.description,
            quantity:    item.quantity,
            unitPrice:   item.unitPrice,
            vatRate:     item.vatRate,
            discount:    item.discount ?? 0,
            productId:   item.productId ?? null,
            unit:        item.unit ?? null,
            sortOrder:   item.sortOrder ?? idx,
          })),
        },
    } as Prisma.OfferUncheckedCreateInput;
    const row = await prisma.offer.create({
      data,
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
      ...((filter.dateFrom || filter.dateTo) ? {
        createdAt: {
          ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
          ...(filter.dateTo   ? { lte: new Date(filter.dateTo + 'T23:59:59') } : {}),
        },
      } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.offer.findMany({
        where: where as Prisma.OfferWhereInput,
        select: OFFER_LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        take:  filter.limit  ?? 50,
        skip:  filter.offset ?? 0,
      }),
      prisma.offer.count({
        where: where as Prisma.OfferWhereInput,
      }),
    ]);

    return {
      offers: rows.map((r: unknown) => mapOffer(r as Record<string, unknown>)),
      total,
    };
  },

  async counts(orgId: string, search?: string): Promise<Record<string, number>> {
    const where: Prisma.OfferWhereInput = {
      organizationId: orgId,
      deletedAt: null,
      ...(search ? {
        OR: [
          { title:         { contains: search, mode: 'insensitive' } },
          { recipientName: { contains: search, mode: 'insensitive' } },
          { recipientEmail:{ contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const rows = await prisma.offer.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    const result: Record<string, number> = { all: 0, draft: 0, sent: 0, viewed: 0, accepted: 0, declined: 0, expired: 0 };
    for (const row of rows) {
      result[row.status] = row._count.id;
      result.all += row._count.id;
    }
    return result;
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

    const updateData = {
        ...(input.title            !== undefined ? { title: input.title }                       : {}),
        ...(input.priceDisplayMode !== undefined ? { priceDisplayMode: input.priceDisplayMode } : {}),
        ...(input.recipientName    !== undefined ? { recipientName: input.recipientName }       : {}),
        ...(input.recipientEmail   !== undefined ? { recipientEmail: input.recipientEmail }     : {}),
        ...(input.recipientCompany !== undefined ? { recipientCompany: input.recipientCompany } : {}),
        ...(input.notes            !== undefined ? { notes: input.notes }                       : {}),
        ...(input.validUntil       !== undefined ? { validUntil: input.validUntil }             : {}),
        ...(input.validityDays     !== undefined ? { validityDays: input.validityDays }         : {}),
        ...(input.status           !== undefined ? { status: input.status }                     : {}),
        ...(input.offerNumber          !== undefined ? { offerNumber: input.offerNumber }                   : {}),
        ...(input.sentAt               !== undefined ? { sentAt: input.sentAt }                             : {}),
        ...(input.viewedAt             !== undefined ? { viewedAt: input.viewedAt }                         : {}),
        ...(input.acceptedAt           !== undefined ? { acceptedAt: input.acceptedAt }                     : {}),
        ...(input.declinedAt           !== undefined ? { declinedAt: input.declinedAt }                     : {}),
        ...(input.reminderSentAt       !== undefined ? { reminderSentAt: input.reminderSentAt }             : {}),
        ...(input.reminderCount        !== undefined ? { reminderCount: input.reminderCount }               : {}),
        ...(input.companyId            !== undefined ? { companyId: input.companyId || null }               : {}),
        ...(input.generatedDocument    !== undefined ? { generatedDocument: input.generatedDocument }       : {}),
        ...(input.generatedPdf         !== undefined ? { generatedPdf: input.generatedPdf ? Buffer.from(input.generatedPdf) : null } : {}),
        ...(input.generatedPdfFingerprint !== undefined ? { generatedPdfFingerprint: input.generatedPdfFingerprint } : {}),
        ...(input.emailSubject         !== undefined ? { emailSubject: input.emailSubject ?? null }         : {}),
        ...(input.emailBody            !== undefined ? { emailBody: input.emailBody ?? null }               : {}),
        ...(input.emailHeaderConfig    !== undefined ? { emailHeaderConfig: input.emailHeaderConfig ?? null } : {}),
        ...(input.signatureImage       !== undefined ? { signatureImage: input.signatureImage }             : {}),
        ...(input.signerName           !== undefined ? { signerName: input.signerName }                     : {}),
        ...(input.publicTokenExpiresAt !== undefined ? { publicTokenExpiresAt: input.publicTokenExpiresAt } : {}),
        ...(input.customFields         !== undefined ? { customFields: input.customFields as Prisma.InputJsonValue } : {}),
        ...(totals ? { totalExVat: totals.totalExVat, totalIncVat: totals.totalIncVat } : {}),
        ...(input.lineItems ? {
          lineItems: {
            create: input.lineItems.map((item, idx) => ({
              description: item.description,
              quantity:    item.quantity,
              unitPrice:   item.unitPrice,
              vatRate:     item.vatRate,
              discount:    item.discount ?? 0,
              productId:   item.productId ?? null,
              unit:        item.unit ?? null,
              sortOrder:   item.sortOrder ?? idx,
            })),
          },
        } : {}),
    } as Prisma.OfferUncheckedUpdateInput;
    const row = await prisma.offer.update({
      where: { id },
      data: updateData,
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

  // Bulk-expire sent/viewed offers whose validUntil has passed — used by cron
  async bulkExpireOffers(): Promise<number> {
    const result = await prisma.offer.updateMany({
      where: {
        deletedAt: null,
        status: { in: ['sent', 'viewed'] },
        validUntil: { lt: new Date() },
      },
      data: { status: 'expired' },
    });
    return result.count;
  },

  // Returns the next sequential offer number for the given org.
  // Accepts an optional transaction client so callers can compose this read
  // inside a larger transaction (e.g. assignOfferNumber below).
  async getNextOfferNumber(
    orgId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx ?? prisma;
    const result = await client.offer.aggregate({
      where: { organizationId: orgId, offerNumber: { not: null } },
      _max:  { offerNumber: true },
    });
    return (result._max.offerNumber ?? 0) + 1;
  },

  /**
   * Atomically assigns the next offer number to an offer that doesn't yet have
   * one.  The read-then-write is wrapped in a serializable transaction; on a
   * unique-constraint collision (two concurrent sends grabbed the same number)
   * the transaction is retried up to MAX_RETRIES times before throwing.
   *
   * Returns the assigned offer number, or the existing one if already set.
   */
  async assignOfferNumber(id: string, orgId: string): Promise<number> {
    // If the offer already has a number, return it immediately (idempotent).
    const existing = await prisma.offer.findFirst({
      where:  { id, organizationId: orgId, deletedAt: null },
      select: { offerNumber: true },
    });
    if (existing?.offerNumber) return existing.offerNumber;

    const MAX_RETRIES = 5;
    let offerNumber!: number;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await prisma.$transaction(async (tx) => {
          offerNumber = await offersRepository.getNextOfferNumber(orgId, tx);
          await tx.offer.update({
            where: { id },
            data:  { offerNumber },
          });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        return offerNumber;
      } catch (err) {
        // P2002 = unique constraint violation — another concurrent request
        // claimed this number; retry with the next available one.
        const isConflict =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002';
        if (!isConflict || attempt === MAX_RETRIES - 1) throw err;
      }
    }

    return offerNumber;
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
        ...(input.offerNumber      !== undefined ? { offerNumber: input.offerNumber }                       : {}),
        ...(input.sentAt           !== undefined ? { sentAt: input.sentAt }                                 : {}),
        ...(input.viewedAt         !== undefined ? { viewedAt: input.viewedAt }                             : {}),
        ...(input.acceptedAt       !== undefined ? { acceptedAt: input.acceptedAt }                         : {}),
        ...(input.declinedAt       !== undefined ? { declinedAt: input.declinedAt }                         : {}),
        ...(input.reminderSentAt   !== undefined ? { reminderSentAt: input.reminderSentAt }                 : {}),
        ...(input.reminderCount    !== undefined ? { reminderCount: input.reminderCount }                   : {}),
        ...(input.signatureImage   !== undefined ? { signatureImage: input.signatureImage }                 : {}),
        ...(input.signerName           !== undefined ? { signerName: input.signerName }                       : {}),
        ...(input.generatedDocument    !== undefined ? { generatedDocument: input.generatedDocument }       : {}),
        ...(input.generatedPdf         !== undefined ? { generatedPdf: input.generatedPdf ? Buffer.from(input.generatedPdf) : null } : {}),
        ...(input.generatedPdfFingerprint !== undefined ? { generatedPdfFingerprint: input.generatedPdfFingerprint } : {}),
        ...(input.emailSubject         !== undefined ? { emailSubject: input.emailSubject ?? null }         : {}),
        ...(input.emailBody            !== undefined ? { emailBody: input.emailBody ?? null }               : {}),
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
              productId:   item.productId ?? null,
              unit:        item.unit ?? null,
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

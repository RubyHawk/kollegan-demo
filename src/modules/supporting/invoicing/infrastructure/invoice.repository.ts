/**
 * Invoice repository — org-scoped, soft-delete-aware Prisma CRUD.
 *
 * Numbering is gapless-at-issue: numbers are assigned via assignInvoiceNumber
 * inside a Serializable transaction with retry on P2002, mirroring the offers
 * module's assignOfferNumber. Prisma is allowed only in this layer.
 */

import { Prisma, prisma } from '@platform/database/prisma';
import { computeInvoiceTotals } from '../domain/invoice-pricing';
import { computeRotRut, normalizeRotRutType } from '../domain/rot-rut';
import type {
  Invoice,
  InvoiceLineItemInput,
  ListInvoicesFilter,
  UpdateInvoiceInput,
} from '../domain/invoice.entity';
import {
  INVOICE_LIST_SELECT,
  INVOICE_SELECT,
  mapInvoice,
} from './invoice.repository-shared';

export interface CreateInvoiceData {
  organizationId: string;
  companyId: string;
  customerId?: string | null;
  offerId?: string | null;
  projectId?: string | null;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  recipientName: string;
  recipientEmail?: string | null;
  recipientCompany?: string | null;
  notes?: string | null;
  paymentReference?: string | null;
  createdBy: string;
  lineItems: InvoiceLineItemInput[];
  /** 'invoice' (default) or 'credit_note'. Existing callers omit it. */
  documentType?: string;
  /** For a credit note: the id of the invoice it reverses. */
  creditedInvoiceId?: string | null;
}

function lineItemCreateData(items: InvoiceLineItemInput[]) {
  return items.map((item, idx) => ({
    description:    item.description,
    quantity:      item.quantity,
    unit:          item.unit ?? null,
    unitPrice:     item.unitPrice,
    vatRate:       item.vatRate ?? 0.25,
    discount:      item.discount ?? 0,
    productId:     item.productId ?? null,
    timeEntryId:   item.timeEntryId ?? null,
    sortOrder:     item.sortOrder ?? idx,
    lineType:      item.lineType ?? 'standard',
    rotRutEligible: item.rotRutEligible ?? false,
  }));
}

export const invoiceRepository = {

  async create(input: CreateInvoiceData): Promise<Invoice> {
    const totals = computeInvoiceTotals(input.lineItems);
    const data = {
      organizationId:   input.organizationId,
      companyId:        input.companyId,
      customerId:       input.customerId ?? null,
      offerId:          input.offerId ?? null,
      projectId:        input.projectId ?? null,
      // invoiceNumber stays NULL until issue/send (gapless-at-issue). Postgres
      // allows many NULLs under the unique (orgId, invoiceNumber) index, so
      // multiple drafts coexist; the real number is claimed atomically at send.
      status:           'draft',
      // documentType defaults to 'invoice' so existing callers are unaffected;
      // a credit note passes 'credit_note' + the credited invoice id.
      documentType:      input.documentType ?? 'invoice',
      creditedInvoiceId: input.creditedInvoiceId ?? null,
      issueDate:        input.issueDate,
      dueDate:          input.dueDate,
      currency:         input.currency,
      recipientName:    input.recipientName,
      recipientEmail:   input.recipientEmail ?? null,
      recipientCompany: input.recipientCompany ?? null,
      notes:            input.notes ?? null,
      paymentReference: input.paymentReference ?? null,
      createdBy:        input.createdBy,
      totalExVat:       totals.totalExVat,
      totalVat:         totals.totalVat,
      totalIncVat:      totals.totalIncVat,
      lineItems:        { create: lineItemCreateData(input.lineItems) },
    } as Prisma.InvoiceUncheckedCreateInput;

    const row = await prisma.invoice.create({ data, select: INVOICE_SELECT });
    return mapInvoice(row as unknown as Record<string, unknown>);
  },

  async findById(id: string, orgId: string): Promise<Invoice | null> {
    const row = await prisma.invoice.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: INVOICE_SELECT,
    });
    return row ? mapInvoice(row as unknown as Record<string, unknown>) : null;
  },

  async list(orgId: string, filter: ListInvoicesFilter): Promise<{ invoices: Invoice[]; total: number }> {
    const where: Prisma.InvoiceWhereInput = {
      organizationId: orgId,
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.companyId ? { companyId: filter.companyId } : {}),
      ...(filter.customerId ? { customerId: filter.customerId } : {}),
      ...((filter.from || filter.to) ? {
        issueDate: {
          ...(filter.from ? { gte: new Date(filter.from) } : {}),
          ...(filter.to   ? { lte: new Date(filter.to) } : {}),
        },
      } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        select: INVOICE_LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        take: filter.limit ?? 50,
        skip: filter.offset ?? 0,
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      invoices: rows.map((r) => mapInvoice(r as unknown as Record<string, unknown>)),
      total,
    };
  },

  /**
   * Updates a draft invoice. Returns null if the invoice does not exist or is
   * not a draft (immutability is enforced at the service layer too, but this is
   * a defensive guard). Line items, when provided, are fully replaced.
   */
  async update(id: string, orgId: string, input: UpdateInvoiceInput): Promise<Invoice | null> {
    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { id: true, status: true, rotRutType: true },
    });
    if (!existing || existing.status !== 'draft') return null;

    let totals: ReturnType<typeof computeInvoiceTotals> | undefined;
    if (input.lineItems) {
      totals = computeInvoiceTotals(input.lineItems);
      await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
    }

    // Recompute the ROT/RUT deduction when the line items change on an invoice
    // that already carries a deduction type — the labour basis is derived from
    // the current lines, so a line edit must re-derive labour + deduction.
    let rotRut: ReturnType<typeof computeRotRut> | undefined;
    const rotRutType = normalizeRotRutType(existing.rotRutType);
    if (input.lineItems && rotRutType) {
      rotRut = computeRotRut(input.lineItems, rotRutType);
    }

    const data = {
      ...(input.companyId        !== undefined ? { companyId: input.companyId } : {}),
      ...(input.customerId       !== undefined ? { customerId: input.customerId || null } : {}),
      ...(input.recipientName    !== undefined ? { recipientName: input.recipientName } : {}),
      ...(input.recipientEmail   !== undefined ? { recipientEmail: input.recipientEmail ?? null } : {}),
      ...(input.recipientCompany !== undefined ? { recipientCompany: input.recipientCompany ?? null } : {}),
      ...(input.notes            !== undefined ? { notes: input.notes ?? null } : {}),
      ...(input.issueDate        !== undefined ? { issueDate: new Date(input.issueDate) } : {}),
      ...(input.dueDate          !== undefined ? { dueDate: new Date(input.dueDate) } : {}),
      ...(input.paymentReference !== undefined ? { paymentReference: input.paymentReference ?? null } : {}),
      ...(totals ? { totalExVat: totals.totalExVat, totalVat: totals.totalVat, totalIncVat: totals.totalIncVat } : {}),
      ...(rotRut ? { rotRutLaborAmount: rotRut.laborAmount, rotRutDeductionAmount: rotRut.deductionAmount } : {}),
      ...(input.lineItems ? { lineItems: { create: lineItemCreateData(input.lineItems) } } : {}),
    } as Prisma.InvoiceUncheckedUpdateInput;

    const row = await prisma.invoice.update({ where: { id }, data, select: INVOICE_SELECT });
    return mapInvoice(row as unknown as Record<string, unknown>);
  },

  /**
   * Persists the ROT/RUT deduction on a draft invoice (the type, buyer fields,
   * and the computed labour + deduction amounts). Org-scoped; returns null if the
   * invoice is not found or is not a draft. Clearing the deduction (rotRutType
   * null) zeroes the amounts and nulls the buyer fields — the immutability guard
   * lives in the service layer; this is a defensive draft-only write.
   */
  async setRotRut(
    id: string,
    orgId: string,
    fields: {
      rotRutType: string | null;
      buyerPersonalNumber: string | null;
      propertyDesignation: string | null;
      housingSocietyOrgNumber: string | null;
      rotRutLaborAmount: number;
      rotRutDeductionAmount: number;
    },
  ): Promise<Invoice | null> {
    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!existing || existing.status !== 'draft') return null;

    const row = await prisma.invoice.update({
      where: { id },
      data: {
        rotRutType:              fields.rotRutType,
        buyerPersonalNumber:     fields.buyerPersonalNumber,
        propertyDesignation:     fields.propertyDesignation,
        housingSocietyOrgNumber: fields.housingSocietyOrgNumber,
        rotRutLaborAmount:       fields.rotRutLaborAmount,
        rotRutDeductionAmount:   fields.rotRutDeductionAmount,
      } as Prisma.InvoiceUncheckedUpdateInput,
      select: INVOICE_SELECT,
    });
    return mapInvoice(row as unknown as Record<string, unknown>);
  },

  /** Soft-deletes a draft invoice. Issued invoices are never deleted. */
  async softDelete(id: string, orgId: string): Promise<boolean> {
    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!existing || existing.status !== 'draft') return false;
    await prisma.invoice.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  },

  /**
   * Applies a status/timestamp transition to an invoice. Used by issue/send and
   * mark-paid. Org-scoped; returns null if the invoice is not found.
   */
  async applyTransition(
    id: string,
    orgId: string,
    data: {
      status?: string;
      issuedAt?: Date;
      sentAt?: Date;
      paidAt?: Date;
      paymentReference?: string;
    },
  ): Promise<Invoice | null> {
    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;
    const row = await prisma.invoice.update({
      where: { id },
      data: data as Prisma.InvoiceUncheckedUpdateInput,
      select: INVOICE_SELECT,
    });
    return mapInvoice(row as unknown as Record<string, unknown>);
  },

  /**
   * Returns the next sequential invoice number for the org. Accepts an optional
   * transaction client so it can compose inside assignInvoiceNumber. Drafts hold
   * NULL, so MAX ignores them and the series starts at 1.
   */
  async getNextInvoiceNumber(orgId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? prisma;
    const result = await client.invoice.aggregate({
      where: { organizationId: orgId, invoiceNumber: { not: null } },
      _max: { invoiceNumber: true },
    });
    return (result._max.invoiceNumber ?? 0) + 1;
  },

  /**
   * Stores the frozen archival PDF bytes on an issued invoice. Org-scoped; the
   * `generatedPdf` column is the immutable document snapshot rendered once at
   * send time. No-op (returns false) if the invoice is not found in the org.
   */
  async storeGeneratedPdf(id: string, orgId: string, bytes: Uint8Array): Promise<boolean> {
    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return false;
    await prisma.invoice.update({
      where: { id },
      data: { generatedPdf: Buffer.from(bytes) },
    });
    return true;
  },

  /**
   * Fetches the stored archival PDF bytes for an invoice. Org-scoped; returns
   * null when the invoice is missing or has no generated PDF yet. `generatedPdf`
   * is deliberately omitted from the shared selects, so this is the only path
   * that reads the (potentially large) bytes.
   */
  async getGeneratedPdf(id: string, orgId: string): Promise<Uint8Array | null> {
    const row = await prisma.invoice.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { generatedPdf: true },
    });
    const bytes = row?.generatedPdf as Uint8Array | Buffer | null | undefined;
    if (!bytes) return null;
    return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  },

  /**
   * Atomically assigns the next invoice number to an as-yet-unnumbered invoice.
   * The read-then-write runs in a Serializable transaction; on a unique-constraint
   * collision (P2002 — two concurrent issues grabbed the same number) it retries
   * up to MAX_RETRIES with the next available number. Idempotent: if the invoice
   * already holds a real number it is returned unchanged. This is what keeps the
   * number series gapless at issue time.
   */
  async assignInvoiceNumber(id: string, orgId: string): Promise<number> {
    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { invoiceNumber: true },
    });
    if (existing?.invoiceNumber) return existing.invoiceNumber;

    const MAX_RETRIES = 5;
    let invoiceNumber!: number;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await prisma.$transaction(async (tx) => {
          invoiceNumber = await invoiceRepository.getNextInvoiceNumber(orgId, tx);
          await tx.invoice.update({ where: { id }, data: { invoiceNumber } });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        return invoiceNumber;
      } catch (err) {
        const isConflict =
          err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
        if (!isConflict || attempt === MAX_RETRIES - 1) throw err;
      }
    }

    return invoiceNumber;
  },
};

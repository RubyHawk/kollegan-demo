/**
 * Invoice repository — shared mappers, selects, and date helpers.
 *
 * Prisma is allowed only in the infrastructure layer (this file + the
 * repository). Rows map to the domain entity with @db.Date columns serialised as
 * 'YYYY-MM-DD' and timestamps as ISO strings.
 */

import type { Invoice, InvoiceLineItem, InvoiceStatus } from '../domain/invoice.entity';

/** Serialises a @db.Date value to 'YYYY-MM-DD' (date-only, no time component). */
export function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function mapInvoiceLineItem(r: Record<string, unknown>): InvoiceLineItem {
  return {
    id:          r.id as string,
    invoiceId:   r.invoiceId as string,
    description: r.description as string,
    quantity:    r.quantity as number,
    unit:        (r.unit as string | null) ?? undefined,
    unitPrice:   r.unitPrice as number,
    vatRate:     r.vatRate as number,
    discount:    (r.discount as number | null) ?? 0,
    productId:   (r.productId as string | null) ?? undefined,
    timeEntryId: (r.timeEntryId as string | null) ?? undefined,
    sortOrder:   (r.sortOrder as number | null) ?? 0,
    lineType:    (r.lineType as string | null) ?? 'standard',
    rotRutEligible: (r.rotRutEligible as boolean | null) ?? false,
  };
}

export function mapInvoice(r: Record<string, unknown>): Invoice {
  const items = (r.lineItems as Record<string, unknown>[] | undefined) ?? [];
  return {
    id:               r.id as string,
    organizationId:   r.organizationId as string,
    companyId:        r.companyId as string,
    customerId:       (r.customerId as string | null) ?? undefined,
    offerId:          (r.offerId as string | null) ?? undefined,
    projectId:        (r.projectId as string | null) ?? undefined,
    invoiceNumber:    (r.invoiceNumber as number | null) ?? undefined,
    status:           r.status as InvoiceStatus,
    documentType:     (r.documentType as string | null) ?? 'invoice',
    issueDate:        toDateOnly(r.issueDate as Date),
    dueDate:          toDateOnly(r.dueDate as Date),
    issuedAt:         r.issuedAt ? (r.issuedAt as Date).toISOString() : undefined,
    paidAt:           r.paidAt ? (r.paidAt as Date).toISOString() : undefined,
    sentAt:           r.sentAt ? (r.sentAt as Date).toISOString() : undefined,
    paymentReference: (r.paymentReference as string | null) ?? undefined,
    totalExVat:       r.totalExVat as number,
    totalVat:         r.totalVat as number,
    totalIncVat:      r.totalIncVat as number,
    currency:         (r.currency as string | null) ?? 'SEK',
    recipientName:    r.recipientName as string,
    recipientEmail:   (r.recipientEmail as string | null) ?? undefined,
    recipientCompany: (r.recipientCompany as string | null) ?? undefined,
    notes:            (r.notes as string | null) ?? undefined,
    // ── ROT/RUT tax deduction ──────────────────────────────────────────────────
    rotRutType:              (r.rotRutType as string | null) ?? undefined,
    buyerPersonalNumber:     (r.buyerPersonalNumber as string | null) ?? undefined,
    propertyDesignation:     (r.propertyDesignation as string | null) ?? undefined,
    housingSocietyOrgNumber: (r.housingSocietyOrgNumber as string | null) ?? undefined,
    rotRutLaborAmount:       (r.rotRutLaborAmount as number | null) ?? 0,
    rotRutDeductionAmount:   (r.rotRutDeductionAmount as number | null) ?? 0,
    rotRutClaimStatus:       (r.rotRutClaimStatus as string | null) ?? undefined,
    createdBy:        r.createdBy as string,
    createdAt:        (r.createdAt as Date).toISOString(),
    updatedAt:        (r.updatedAt as Date).toISOString(),
    lineItems:        items.map(mapInvoiceLineItem),
  };
}

export const INVOICE_LINE_ITEM_SELECT = {
  id: true, invoiceId: true, description: true, quantity: true, unit: true,
  unitPrice: true, vatRate: true, discount: true, productId: true, timeEntryId: true,
  sortOrder: true, lineType: true, rotRutEligible: true,
};

export const INVOICE_SELECT = {
  id: true, organizationId: true, companyId: true, customerId: true,
  offerId: true, projectId: true, invoiceNumber: true, status: true, documentType: true,
  issueDate: true, dueDate: true, issuedAt: true, paidAt: true, sentAt: true,
  paymentReference: true, totalExVat: true, totalVat: true, totalIncVat: true,
  currency: true, recipientName: true, recipientEmail: true, recipientCompany: true,
  notes: true,
  rotRutType: true, buyerPersonalNumber: true, propertyDesignation: true,
  housingSocietyOrgNumber: true, rotRutLaborAmount: true, rotRutDeductionAmount: true,
  rotRutClaimStatus: true,
  createdBy: true, createdAt: true, updatedAt: true,
  lineItems: { select: INVOICE_LINE_ITEM_SELECT, orderBy: { sortOrder: 'asc' as const } },
};

/** Lightweight list select — omits line items for cheaper list payloads. */
export const INVOICE_LIST_SELECT = {
  id: true, organizationId: true, companyId: true, customerId: true,
  offerId: true, projectId: true, invoiceNumber: true, status: true, documentType: true,
  issueDate: true, dueDate: true, issuedAt: true, paidAt: true, sentAt: true,
  paymentReference: true, totalExVat: true, totalVat: true, totalIncVat: true,
  currency: true, recipientName: true, recipientEmail: true, recipientCompany: true,
  notes: true,
  rotRutType: true, buyerPersonalNumber: true, propertyDesignation: true,
  housingSocietyOrgNumber: true, rotRutLaborAmount: true, rotRutDeductionAmount: true,
  rotRutClaimStatus: true,
  createdBy: true, createdAt: true, updatedAt: true,
  lineItems: { select: INVOICE_LINE_ITEM_SELECT, orderBy: { sortOrder: 'asc' as const } },
};

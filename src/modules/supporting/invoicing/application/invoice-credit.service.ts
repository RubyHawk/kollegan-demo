/**
 * Credit note (kreditfaktura) use case — issues a reversing credit note.
 *
 * A credit note fully reverses an already-issued invoice: it copies the
 * original's recipient/company/currency, negates every line quantity so the
 * totals come out negative (reducing the customer's balance), links back to the
 * original via `creditedInvoiceId`, and marks the original `credited` so it
 * cannot be reversed twice. The returned draft is issued by the caller via the
 * existing `sendInvoice`, which assigns the gapless number and renders the
 * "Kreditfaktura" PDF/email — no new send logic is needed here.
 */

import { logger } from '@platform/logging/logger';
import { Errors } from '@platform/api/errors';
import { invoiceRepository } from '../infrastructure/invoice.repository';
import type { CreateInvoiceData } from '../infrastructure/invoice.repository';
import type { Invoice, InvoiceLineItemInput } from '../domain/invoice.entity';
import { canCredit } from '../domain/invoice-status';

const TAG = 'InvoiceCreditService';

export interface CreateCreditNoteOptions {
  /** Free-text reason appended to the credit note's notes. */
  reason?: string;
}

function todayDateOnly(): Date {
  return new Date(new Date().toISOString().slice(0, 10));
}

/**
 * Reverses an invoice's line items: keeps unitPrice/vatRate/discount and the
 * lineType/rotRutEligible classification, but negates the quantity so each line
 * — and therefore the credit note's ex-VAT/VAT/inc-VAT totals — is negative.
 */
function reverseLineItems(original: Invoice): InvoiceLineItemInput[] {
  return original.lineItems.map((item, idx) => ({
    description:    item.description,
    quantity:      -item.quantity,
    unit:          item.unit ?? null,
    unitPrice:     item.unitPrice,
    vatRate:       item.vatRate,
    discount:      item.discount,
    productId:     item.productId ?? null,
    sortOrder:     item.sortOrder ?? idx,
    lineType:      item.lineType,
    rotRutEligible: item.rotRutEligible,
  }));
}

function buildCreditNoteNotes(original: Invoice, reason?: string): string {
  const base = `Kreditfaktura avseende faktura ${original.invoiceNumber ?? ''}`.trim();
  const trimmedReason = reason?.trim();
  return trimmedReason ? `${base}\n${trimmedReason}` : base;
}

/**
 * Creates a draft credit note that fully reverses `originalInvoiceId`, then marks
 * the original `credited`. Returns null when the original is not found in the org
 * (→404); throws `Errors.conflict` (→409) when the original may not be credited
 * (not issued, cancelled, already credited, or itself a credit note).
 */
export async function createCreditNote(
  orgId: string,
  actorId: string,
  originalInvoiceId: string,
  opts?: CreateCreditNoteOptions,
): Promise<Invoice | null> {
  const original = await invoiceRepository.findById(originalInvoiceId, orgId);
  if (!original) return null;
  if (!canCredit(original)) {
    throw Errors.conflict(
      `Invoice cannot be credited from status '${original.status}' (documentType '${original.documentType}')`,
    );
  }

  const today = todayDateOnly();
  const data: CreateInvoiceData = {
    organizationId:    orgId,
    companyId:         original.companyId,
    customerId:        original.customerId ?? null,
    issueDate:         today,
    dueDate:           today,
    currency:          original.currency,
    recipientName:     original.recipientName,
    recipientEmail:    original.recipientEmail ?? null,
    recipientCompany:  original.recipientCompany ?? null,
    notes:             buildCreditNoteNotes(original, opts?.reason),
    paymentReference:  original.paymentReference ?? null,
    createdBy:         actorId,
    documentType:      'credit_note',
    creditedInvoiceId: original.id,
    lineItems:         reverseLineItems(original),
  };

  const creditNote = await invoiceRepository.create(data);

  // Only after the draft exists: mark the original reversed so it cannot be
  // credited twice (canCredit rejects status 'credited').
  await invoiceRepository.applyTransition(original.id, orgId, { status: 'credited' });

  logger.info(TAG, `Credit note draft created: ${creditNote.id}`, {
    orgId,
    originalInvoiceId: original.id,
    originalInvoiceNumber: original.invoiceNumber,
    totalIncVat: creditNote.totalIncVat,
  });

  return creditNote;
}

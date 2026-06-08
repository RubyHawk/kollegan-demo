/**
 * Invoice numbering service — thin wrapper over the repository's gapless numbering.
 *
 * Numbers are assigned at ISSUE/SEND time, never at draft creation, and an issued
 * invoice is never deleted. Together these keep the per-organization invoice
 * number series gapless — a legal requirement for accounting in Sweden (and the
 * EU more broadly). The atomicity guarantee (Serializable transaction + retry on
 * the unique constraint) lives in invoiceRepository.assignInvoiceNumber.
 */

import { invoiceRepository } from '../infrastructure/invoice.repository';

/** Peeks the next number without consuming it (e.g. for previews). */
export async function previewNextInvoiceNumber(orgId: string): Promise<number> {
  return invoiceRepository.getNextInvoiceNumber(orgId);
}

/** Atomically assigns and returns the gapless invoice number for an invoice. */
export async function assignInvoiceNumber(invoiceId: string, orgId: string): Promise<number> {
  return invoiceRepository.assignInvoiceNumber(invoiceId, orgId);
}

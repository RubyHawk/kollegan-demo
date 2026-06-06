/**
 * Invoicing application service — use cases for the invoice lifecycle.
 *
 * Immutability is enforced here: only drafts can be updated or deleted, and a
 * number is assigned exactly once, at issue/send. Repositories own persistence;
 * this layer owns orchestration, guards, and domain events.
 */

import { logger } from '@platform/logging/logger';
import { Errors } from '@platform/api/errors';
import { eventBus } from '@platform/events';
import { invoiceRepository } from '../infrastructure/invoice.repository';
import { invoiceSourcesRepository, type InvoiceCompany } from '../infrastructure/invoice-sources.repository';
import type {
  CreateInvoiceInput,
  Invoice,
  ListInvoicesFilter,
  UpdateInvoiceInput,
} from '../domain/invoice.entity';
import { canDelete, canEdit, canMarkPaid, canSend } from '../domain/invoice-status';
import { INVOICE_PAID, INVOICE_SENT } from '../events/invoice.events';
import {
  buildBlankInvoice,
  buildInvoiceFromOffer,
  buildInvoiceFromTime,
} from './invoice-create.service';
import { generateInvoicePdfBytes } from './invoice-pdf';
import { sendInvoiceEmail } from './invoice-email';

const TAG = 'InvoiceService';

export type { CreateInvoiceInput, UpdateInvoiceInput, ListInvoicesFilter };

/** Resolves the public app origin for absolute links (PDF route) in emails. */
function resolveAppOrigin(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.PUBLIC_OFFER_BASE_URL,
    'http://localhost:3000',
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return new URL(candidate).origin;
    } catch {
      continue;
    }
  }
  return 'http://localhost:3000';
}

/**
 * Renders the archival PDF once and stores it on the invoice, then emails the
 * recipient a link to the PDF route. Both steps are best-effort: any PDF or
 * email failure is logged and swallowed so a transient outage never blocks
 * issuing or rolls back the already-committed number/status transition.
 *
 * Freeze-once: the PDF is the frozen archival snapshot — if the invoice already
 * carries stored bytes it is never re-rendered.
 */
async function deliverIssuedInvoice(invoice: Invoice, orgId: string): Promise<void> {
  let company: InvoiceCompany | null = null;
  try {
    company = await invoiceSourcesRepository.getInvoiceCompany(invoice.companyId, orgId);
    if (!company) {
      logger.warn(TAG, `Company not found for invoice ${invoice.id}; skipping PDF + email`, { orgId });
      return;
    }

    const existing = await invoiceRepository.getGeneratedPdf(invoice.id, orgId);
    if (!existing) {
      const bytes = await generateInvoicePdfBytes(invoice, company);
      await invoiceRepository.storeGeneratedPdf(invoice.id, orgId, bytes);
      logger.info(TAG, `Invoice PDF frozen: ${invoice.id}`, { invoiceNumber: invoice.invoiceNumber });
    }
  } catch (err) {
    logger.error(TAG, `Invoice PDF generation failed for ${invoice.id} (non-fatal)`, { err, orgId });
  }

  if (!invoice.recipientEmail) return;

  try {
    const origin = resolveAppOrigin();
    await sendInvoiceEmail({
      to: invoice.recipientEmail,
      invoiceNumber: invoice.invoiceNumber ?? null,
      recipientName: invoice.recipientName,
      sellerName: company?.name ?? invoice.recipientCompany ?? '',
      senderEmail: company?.senderEmail,
      senderName: company?.senderName,
      totalIncVat: invoice.totalIncVat,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      pdfUrl: `${origin}/api/v1/invoices/${invoice.id}/pdf`,
      documentType: invoice.documentType,
    });
  } catch (err) {
    logger.error(TAG, `Invoice email failed for ${invoice.id} (non-fatal)`, { err, orgId });
  }
}

/**
 * Creates a draft invoice from one of three sources: blank, an accepted offer,
 * or a project's billable time. No number is assigned (gapless-at-issue). For the
 * time source, the consumed time entries are marked billed (invoiceId set) in the
 * same flow, so they cannot be billed twice.
 */
export async function createInvoice(
  orgId: string,
  actorId: string,
  input: CreateInvoiceInput,
): Promise<Invoice> {
  if (input.source === 'offer') {
    const data = await buildInvoiceFromOffer(orgId, actorId, input);
    const invoice = await invoiceRepository.create(data);
    logger.info(TAG, `Invoice draft created from offer: ${invoice.id}`, { orgId, offerId: input.offerId });
    return invoice;
  }

  if (input.source === 'time') {
    const { data, timeEntryIds } = await buildInvoiceFromTime(orgId, actorId, input);
    const invoice = await invoiceRepository.create(data);
    // Mark the consumed time entries billed in the same flow so they cannot be
    // re-invoiced. Scoped to entries still unbilled to avoid double-billing races.
    const billed = await invoiceSourcesRepository.markTimeEntriesBilled(timeEntryIds, invoice.id, orgId);
    logger.info(TAG, `Invoice draft created from time: ${invoice.id}`, {
      orgId, projectId: input.projectId, billedTimeEntries: billed,
    });
    return invoice;
  }

  const data = await buildBlankInvoice(orgId, actorId, input);
  const invoice = await invoiceRepository.create(data);
  logger.info(TAG, `Invoice draft created: ${invoice.id}`, { orgId });
  return invoice;
}

export async function listInvoices(
  orgId: string,
  filter: ListInvoicesFilter,
): Promise<{ invoices: Invoice[]; total: number }> {
  return invoiceRepository.list(orgId, filter);
}

export async function getInvoice(id: string, orgId: string): Promise<Invoice | null> {
  return invoiceRepository.findById(id, orgId);
}

/**
 * Updates a draft invoice and recomputes totals. Rejects with 409 if the invoice
 * has already been issued (financially immutable).
 */
export async function updateInvoice(
  id: string,
  orgId: string,
  input: UpdateInvoiceInput,
): Promise<Invoice | null> {
  const existing = await invoiceRepository.findById(id, orgId);
  if (!existing) return null;
  if (!canEdit(existing.status)) {
    throw Errors.conflict('Only draft invoices can be edited; this invoice has been issued');
  }
  return invoiceRepository.update(id, orgId, input);
}

/** Soft-deletes a draft invoice. Rejects issued invoices with 409. */
export async function deleteInvoice(id: string, orgId: string): Promise<boolean> {
  const existing = await invoiceRepository.findById(id, orgId);
  if (!existing) return false;
  if (!canDelete(existing.status)) {
    throw Errors.conflict('Only draft invoices can be deleted; an issued invoice is permanent');
  }
  return invoiceRepository.softDelete(id, orgId);
}

/**
 * Issues/sends a draft invoice: assigns the gapless invoice number (if not set),
 * sets status='sent' and the issuedAt/sentAt timestamps, and freezes the row.
 * Then renders + stores the archival PDF (once) and emails the recipient a link
 * to it. PDF/email delivery is best-effort and non-fatal — see
 * `deliverIssuedInvoice` — so it never blocks issuing or rolls back the
 * committed number/status. Emits invoice.sent.
 */
export async function sendInvoice(id: string, orgId: string): Promise<Invoice | null> {
  const existing = await invoiceRepository.findById(id, orgId);
  if (!existing) return null;
  if (!canSend(existing.status)) {
    throw Errors.conflict(`Invoice cannot be sent from status '${existing.status}'`);
  }

  const invoiceNumber = await invoiceRepository.assignInvoiceNumber(id, orgId);
  const now = new Date();
  const updated = await invoiceRepository.applyTransition(id, orgId, {
    status: 'sent',
    issuedAt: now,
    sentAt: now,
  });
  if (!updated) return null;

  eventBus.publish({
    type: INVOICE_SENT,
    orgId,
    occurredAt: now.toISOString(),
    payload: {
      invoiceId: updated.id,
      invoiceNumber,
      totalIncVat: updated.totalIncVat,
      currency: updated.currency,
    },
  });

  logger.info(TAG, `Invoice sent: ${id}`, { invoiceNumber });

  // Best-effort, non-fatal: the number/status are already committed above, so a
  // PDF or email failure here must never throw or roll the invoice back.
  await deliverIssuedInvoice(updated, orgId);

  return updated;
}

/** Alias for sendInvoice — issuing assigns the number and moves the invoice to sent. */
export async function issueInvoice(id: string, orgId: string): Promise<Invoice | null> {
  return sendInvoice(id, orgId);
}

/**
 * Returns the frozen archival PDF bytes for an issued invoice, or null when the
 * invoice does not exist, is still a draft, or has no stored PDF yet. Org-scoped.
 */
export async function getInvoicePdfBytes(id: string, orgId: string): Promise<Uint8Array | null> {
  const invoice = await invoiceRepository.findById(id, orgId);
  if (!invoice || invoice.status === 'draft') return null;
  return invoiceRepository.getGeneratedPdf(id, orgId);
}

/**
 * Marks an issued invoice paid: sets paidAt (defaults to now) and status='paid'.
 * Rejects drafts/cancelled/already-paid with 409. Emits invoice.paid.
 */
export async function markInvoicePaid(
  id: string,
  orgId: string,
  paidAt?: string,
): Promise<Invoice | null> {
  const existing = await invoiceRepository.findById(id, orgId);
  if (!existing) return null;
  if (!canMarkPaid(existing.status)) {
    throw Errors.conflict(`Invoice cannot be marked paid from status '${existing.status}'`);
  }

  const paidDate = paidAt ? new Date(paidAt) : new Date();
  const updated = await invoiceRepository.applyTransition(id, orgId, {
    status: 'paid',
    paidAt: paidDate,
  });
  if (!updated) return null;

  eventBus.publish({
    type: INVOICE_PAID,
    orgId,
    occurredAt: new Date().toISOString(),
    payload: {
      invoiceId: updated.id,
      invoiceNumber: updated.invoiceNumber ?? 0,
      totalIncVat: updated.totalIncVat,
      currency: updated.currency,
    },
  });

  logger.info(TAG, `Invoice marked paid: ${id}`, { paidAt: paidDate.toISOString() });
  return updated;
}

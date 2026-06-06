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
import { invoiceSourcesRepository } from '../infrastructure/invoice-sources.repository';
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

const TAG = 'InvoiceService';

export type { CreateInvoiceInput, UpdateInvoiceInput, ListInvoicesFilter };

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
 * PDF generation and email are out of scope for this phase. Emits invoice.sent.
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
  return updated;
}

/** Alias for sendInvoice — issuing assigns the number and moves the invoice to sent. */
export async function issueInvoice(id: string, orgId: string): Promise<Invoice | null> {
  return sendInvoice(id, orgId);
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

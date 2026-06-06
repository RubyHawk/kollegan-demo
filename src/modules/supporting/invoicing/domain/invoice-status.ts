/**
 * Invoice status domain — the status union and pure transition guards.
 *
 * Legal/financial rule: an invoice is a draft until it is issued (sent). Once a
 * gapless invoice number is assigned and the invoice leaves draft, it is
 * financially immutable — it can no longer be edited or deleted. Corrections are
 * made via credit notes (a later phase), never by mutating the original.
 */

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'credited';

export const INVOICE_STATUSES: readonly InvoiceStatus[] = [
  'draft',
  'sent',
  'viewed',
  'paid',
  'overdue',
  'cancelled',
  'credited',
] as const;

/**
 * Only a draft invoice can be edited or deleted. After issue/send the row is
 * frozen to keep the invoice-number series gapless and audit-safe.
 */
export function canEdit(status: InvoiceStatus): boolean {
  return status === 'draft';
}

/** Deleting follows the same rule as editing — drafts only. */
export function canDelete(status: InvoiceStatus): boolean {
  return status === 'draft';
}

/**
 * Only a draft can be issued/sent. Re-sending an already-sent invoice is not a
 * status transition (no number is re-assigned) and is rejected here.
 */
export function canSend(status: InvoiceStatus): boolean {
  return status === 'draft';
}

/**
 * An invoice can be marked paid once it has been issued and is still
 * outstanding. Cancelled/credited/already-paid invoices cannot be paid.
 */
export function canMarkPaid(status: InvoiceStatus): boolean {
  return status === 'sent' || status === 'viewed' || status === 'overdue';
}

/**
 * An invoice may be credited (reversed by a credit note) only when it has been
 * issued and is not already reversed: status ∈ {sent, viewed, paid, overdue}.
 * Drafts (never issued), cancelled, and already-`credited` invoices are rejected,
 * and a credit note itself cannot be credited (documentType must be 'invoice').
 * Marking the original `credited` after issuing the note also blocks a second
 * credit note on the same invoice.
 */
export function canCredit(invoice: { status: InvoiceStatus; documentType: string }): boolean {
  if (invoice.documentType !== 'invoice') return false;
  return (
    invoice.status === 'sent' ||
    invoice.status === 'viewed' ||
    invoice.status === 'paid' ||
    invoice.status === 'overdue'
  );
}

export function isInvoiceStatus(value: string): value is InvoiceStatus {
  return (INVOICE_STATUSES as readonly string[]).includes(value);
}

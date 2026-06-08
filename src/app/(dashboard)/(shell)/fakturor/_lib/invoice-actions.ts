/**
 * Client-side mirror of the invoicing domain status guards
 * (src/modules/supporting/invoicing/domain/invoice-status.ts). Duplicated here
 * because app code must not import module internals; the server re-validates
 * every transition, so this only governs which buttons are shown.
 */

import type { Invoice, InvoiceStatus } from '@shared/lib/api/invoices.api';

export function canEdit(status: InvoiceStatus): boolean {
  return status === 'draft';
}

export function canMarkPaid(status: InvoiceStatus): boolean {
  return status === 'sent' || status === 'viewed' || status === 'overdue';
}

export function canCredit(invoice: Pick<Invoice, 'status' | 'documentType'>): boolean {
  if (invoice.documentType !== 'invoice') return false;
  return (
    invoice.status === 'sent' ||
    invoice.status === 'viewed' ||
    invoice.status === 'paid' ||
    invoice.status === 'overdue'
  );
}

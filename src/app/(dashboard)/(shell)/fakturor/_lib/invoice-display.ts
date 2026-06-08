import type { InvoiceStatus } from '@shared/lib/api/invoices.api';

/** Swedish label for each invoice status. */
export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Utkast',
  sent: 'Skickad',
  viewed: 'Visad',
  paid: 'Betald',
  overdue: 'Förfallen',
  cancelled: 'Makulerad',
  credited: 'Krediterad',
};

/** Badge variant per status (maps to the shared Badge component variants). */
export const INVOICE_STATUS_VARIANT: Record<
  InvoiceStatus,
  'default' | 'secondary' | 'destructive' | 'outline' | 'warning'
> = {
  draft: 'secondary',
  sent: 'default',
  viewed: 'default',
  paid: 'default',
  overdue: 'destructive',
  cancelled: 'secondary',
  credited: 'warning',
};

/** Tabs shown on the list view. `all` has no status filter. */
export const INVOICE_STATUS_TABS: Array<{ id: InvoiceStatus | 'all'; label: string }> = [
  { id: 'all', label: 'Alla' },
  { id: 'draft', label: 'Utkast' },
  { id: 'sent', label: 'Skickade' },
  { id: 'paid', label: 'Betalda' },
  { id: 'overdue', label: 'Förfallna' },
  { id: 'credited', label: 'Krediterade' },
];

export function fmtMoney(value: number, currency = 'SEK'): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function fmtDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Human document label: credit notes read "Kreditfaktura", others "Faktura". */
export function documentLabel(documentType: string): string {
  return documentType === 'credit_note' ? 'Kreditfaktura' : 'Faktura';
}

/** The invoice's display reference: its number when issued, else a short id. */
export function invoiceRef(invoice: { invoiceNumber?: number; id: string }): string {
  return invoice.invoiceNumber != null
    ? `#${invoice.invoiceNumber}`
    : invoice.id.slice(0, 8).toUpperCase();
}

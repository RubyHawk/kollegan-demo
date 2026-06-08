// ─── Invoice domain events ──────────────────────────────────────────────────────

export const INVOICE_SENT = 'invoicing.invoice.sent' as const;
export const INVOICE_PAID = 'invoicing.invoice.paid' as const;

export interface InvoiceSentEvent {
  type: typeof INVOICE_SENT;
  orgId: string;
  occurredAt: string;
  payload: { invoiceId: string; invoiceNumber: number; totalIncVat: number; currency: string };
}

export interface InvoicePaidEvent {
  type: typeof INVOICE_PAID;
  orgId: string;
  occurredAt: string;
  payload: { invoiceId: string; invoiceNumber: number; totalIncVat: number; currency: string };
}

export type InvoiceEvent = InvoiceSentEvent | InvoicePaidEvent;

/**
 * Invoicing module — domain types.
 *
 * Dates are serialised as strings: `issueDate`/`dueDate` as 'YYYY-MM-DD' (they
 * are @db.Date), timestamps (`issuedAt`, `paidAt`, `sentAt`, …) as ISO 8601.
 */

import type { InvoiceStatus } from './invoice-status';

export type { InvoiceStatus };

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  vatRate: number;
  discount: number;
  productId?: string;
  timeEntryId?: string;
  sortOrder: number;
  lineType: string;
  rotRutEligible: boolean;
}

export interface Invoice {
  id: string;
  organizationId: string;
  companyId: string;
  customerId?: string;
  offerId?: string;
  projectId?: string;
  invoiceNumber?: number;
  status: InvoiceStatus;
  documentType: string;
  issueDate: string;  // YYYY-MM-DD
  dueDate: string;    // YYYY-MM-DD
  issuedAt?: string;
  paidAt?: string;
  sentAt?: string;
  paymentReference?: string;
  totalExVat: number;
  totalVat: number;
  totalIncVat: number;
  currency: string;
  recipientName: string;
  recipientEmail?: string;
  recipientCompany?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lineItems: InvoiceLineItem[];
}

// ─── Input types ───────────────────────────────────────────────────────────────

export interface InvoiceLineItemInput {
  description: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  /** Optional on input — defaults to the line/company VAT rate when omitted. */
  vatRate?: number;
  discount?: number | null;
  productId?: string | null;
  timeEntryId?: string | null;
  sortOrder?: number;
  lineType?: string;
  rotRutEligible?: boolean;
}

/** A blank draft (no source document). */
export interface CreateBlankInvoiceInput {
  source?: 'blank';
  companyId?: string;
  customerId?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientCompany?: string;
  notes?: string;
  lineItems?: InvoiceLineItemInput[];
}

/** Create from an accepted offer — copies its line items + recipient. */
export interface CreateInvoiceFromOfferInput {
  source: 'offer';
  offerId: string;
  notes?: string;
}

/** Create from a project's billable, unbilled time entries. */
export interface CreateInvoiceFromTimeInput {
  source: 'time';
  projectId: string;
  timeEntryIds: string[];
  /** Hourly rate applied to grouped time when the entry carries no price. */
  hourlyRate?: number;
  notes?: string;
}

export type CreateInvoiceInput =
  | CreateBlankInvoiceInput
  | CreateInvoiceFromOfferInput
  | CreateInvoiceFromTimeInput;

export interface UpdateInvoiceInput {
  companyId?: string;
  customerId?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientCompany?: string;
  notes?: string;
  issueDate?: string; // YYYY-MM-DD
  dueDate?: string;   // YYYY-MM-DD
  paymentReference?: string;
  lineItems?: InvoiceLineItemInput[];
}

export interface ListInvoicesFilter {
  status?: InvoiceStatus;
  companyId?: string;
  customerId?: string;
  from?: string; // YYYY-MM-DD (inclusive, on issueDate)
  to?: string;   // YYYY-MM-DD (inclusive, on issueDate)
  limit?: number;
  offset?: number;
}

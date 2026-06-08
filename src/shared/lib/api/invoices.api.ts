import { apiDelete, apiGet, apiPatch, apiPost } from '../api-client';

const BASE_URL = '/api/v1/invoices';

interface ApiEnvelope<T> {
  data: T;
}

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'credited';

export type InvoiceDocumentType = 'invoice' | 'credit_note';
export type RotRutType = 'ROT' | 'RUT';

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
  documentType: InvoiceDocumentType;
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  issuedAt?: string;
  paidAt?: string;
  sentAt?: string;
  paymentReference?: string;
  creditedInvoiceId?: string;
  totalExVat: number;
  totalVat: number;
  totalIncVat: number;
  currency: string;
  recipientName: string;
  recipientEmail?: string;
  recipientCompany?: string;
  notes?: string;
  // ROT/RUT deduction
  rotRutType?: RotRutType | null;
  buyerPersonalNumber?: string;
  propertyDesignation?: string;
  housingSocietyOrgNumber?: string;
  rotRutLaborAmount: number;
  rotRutDeductionAmount: number;
  rotRutClaimStatus?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItemInput {
  description: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  vatRate?: number;
  discount?: number | null;
  productId?: string | null;
  sortOrder?: number;
  lineType?: string;
  rotRutEligible?: boolean;
}

export interface ListInvoicesParams {
  status?: InvoiceStatus;
  companyId?: string;
  customerId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface CreateBlankInvoicePayload {
  source?: 'blank';
  companyId: string;
  customerId?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientCompany?: string;
  notes?: string;
  lineItems?: InvoiceLineItemInput[];
}

export interface CreateInvoiceFromOfferPayload {
  source: 'offer';
  offerId: string;
  notes?: string;
}

export interface CreateInvoiceFromTimePayload {
  source: 'time';
  projectId: string;
  timeEntryIds: string[];
  hourlyRate?: number;
  notes?: string;
}

export type CreateInvoicePayload =
  | CreateBlankInvoicePayload
  | CreateInvoiceFromOfferPayload
  | CreateInvoiceFromTimePayload;

export interface UpdateInvoicePayload {
  companyId?: string;
  customerId?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientCompany?: string;
  notes?: string;
  issueDate?: string;
  dueDate?: string;
  paymentReference?: string;
  lineItems?: InvoiceLineItemInput[];
}

export interface SetRotRutPayload {
  rotRutType: RotRutType | null;
  buyerPersonalNumber?: string;
  propertyDesignation?: string;
  housingSocietyOrgNumber?: string;
}

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listInvoices(params: ListInvoicesParams = {}) {
  const res = await apiGet<ApiEnvelope<{
    invoices: Invoice[];
    total: number;
    limit: number;
    offset: number;
  }>>(`${BASE_URL}${query(params)}`);
  return res.data;
}

export async function getInvoice(id: string): Promise<Invoice> {
  const res = await apiGet<ApiEnvelope<Invoice>>(`${BASE_URL}/${id}`);
  return res.data;
}

export async function createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
  const res = await apiPost<ApiEnvelope<Invoice>>(BASE_URL, payload);
  return res.data;
}

export async function updateInvoice(id: string, payload: UpdateInvoicePayload): Promise<Invoice> {
  const res = await apiPatch<ApiEnvelope<Invoice>>(`${BASE_URL}/${id}`, payload);
  return res.data;
}

export async function deleteInvoice(id: string): Promise<void> {
  await apiDelete(`${BASE_URL}/${id}`);
}

export async function sendInvoice(id: string): Promise<Invoice> {
  const res = await apiPost<ApiEnvelope<Invoice>>(`${BASE_URL}/${id}/send`, {});
  return res.data;
}

export async function markInvoicePaid(id: string, paidAt?: string): Promise<Invoice> {
  const res = await apiPost<ApiEnvelope<Invoice>>(`${BASE_URL}/${id}/mark-paid`, paidAt ? { paidAt } : {});
  return res.data;
}

export async function createCreditNote(id: string, reason?: string): Promise<Invoice> {
  const res = await apiPost<ApiEnvelope<Invoice>>(`${BASE_URL}/${id}/credit`, reason ? { reason } : {});
  return res.data;
}

export async function setInvoiceRotRut(id: string, payload: SetRotRutPayload): Promise<Invoice> {
  const res = await apiPost<ApiEnvelope<Invoice>>(`${BASE_URL}/${id}/rotrut`, payload);
  return res.data;
}

/** Direct link to the frozen archival PDF (issued invoices only). */
export function getInvoicePdfUrl(id: string): string {
  return `${BASE_URL}/${id}/pdf`;
}

/** Direct link to the Husarbete (Skatteverket) ROT/RUT payment-request XML. */
export function getInvoiceRotRutExportUrl(id: string): string {
  return `${BASE_URL}/${id}/rotrut-export`;
}

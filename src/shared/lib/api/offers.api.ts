import { apiDelete, apiGet, apiPatch, apiPost, fetchWithRefresh } from '../api-client';

const BASE_URL = '/api/v1/offers';

interface ApiEnvelope<T> {
  data: T;
}

export type OfferStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
export type OfferPriceDisplayMode = 'exclusive' | 'inclusive';
export type OfferProjectStage = 'details' | 'ordered' | 'arrived' | 'in_progress' | 'completed';
export type OfferAction = 'send' | 'accept' | 'decline' | 'duplicate' | 'remind';

export interface OfferProjectSummary {
  id: string;
  stage: OfferProjectStage;
  completedAt?: string | null;
}

export interface OfferLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discount: number;
  productId?: string;
  unit?: string;
  sortOrder?: number;
}

export interface Offer {
  id: string;
  organizationId: string;
  offerNumber: number | null;
  priceDisplayMode: OfferPriceDisplayMode;
  title: string;
  status: OfferStatus;
  recipientName: string;
  recipientEmail: string;
  recipientCompany?: string;
  totalExVat: number;
  totalIncVat: number;
  lineItems: OfferLineItem[];
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  reminderSentAt?: string;
  reminderCount: number;
  customerId?: string;
  leadId?: string;
  companyId?: string;
  templateId?: string;
  publicToken: string;
  publicTokenExpiresAt?: string;
  notes?: string;
  validUntil?: string;
  validityDays?: number;
  generatedDocument?: string | null;
  project?: OfferProjectSummary | null;
}

export interface SaveOfferPayload {
  templateId?: string;
  customerId?: string;
  leadId?: string;
  companyId: string;
  title: string;
  priceDisplayMode: OfferPriceDisplayMode;
  recipientName: string;
  recipientEmail: string;
  recipientCompany?: string;
  notes?: string;
  validityDays: number;
  lineItems: OfferLineItem[];
}

export interface BlockingErrorPayload {
  code?: string;
  field?: string;
  message?: string;
}

export interface ListOffersParams {
  status?: OfferStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface CountOffersParams {
  search?: string;
}

export interface BulkSendOffersResult {
  sent: number;
  failed: number;
}

export class OfferActionApiError extends Error {
  constructor(
    public status: number,
    public detail?: string,
    public blockingErrors: BlockingErrorPayload[] = [],
  ) {
    super(detail ?? `Fel ${status}`);
    this.name = 'OfferActionApiError';
  }
}

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listOffers(params: ListOffersParams = {}) {
  const res = await apiGet<ApiEnvelope<{
    offers: Offer[];
    total: number;
    limit: number;
    offset: number;
  }>>(`${BASE_URL}${query(params)}`);
  return res.data;
}

export async function countOffers(params: CountOffersParams = {}): Promise<Record<string, number>> {
  const res = await apiGet<ApiEnvelope<{ counts: Record<string, number> }>>(
    `${BASE_URL}/counts${query(params)}`,
  );
  return res.data.counts;
}

export async function getOffer(id: string): Promise<Offer> {
  const res = await apiGet<ApiEnvelope<Offer>>(`${BASE_URL}/${id}`);
  return res.data;
}

export function getOfferPdfUrl(id: string): string {
  return `${BASE_URL}/${id}/pdf`;
}

export async function createOffer(payload: SaveOfferPayload): Promise<Offer> {
  const res = await apiPost<ApiEnvelope<Offer>>(BASE_URL, payload);
  return res.data;
}

export async function updateOffer(id: string, payload: SaveOfferPayload): Promise<Offer> {
  const res = await apiPatch<ApiEnvelope<Offer>>(`${BASE_URL}/${id}`, payload);
  return res.data;
}

export async function runOfferAction(id: string, action: OfferAction): Promise<Offer> {
  const res = await fetchWithRefresh(`${BASE_URL}/${id}${query({ action })}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({})) as {
      detail?: string;
      blockingErrors?: BlockingErrorPayload[];
    };
    throw new OfferActionApiError(res.status, payload.detail, payload.blockingErrors ?? []);
  }

  const json = await res.json() as ApiEnvelope<Offer>;
  return json.data;
}

export async function deleteOffer(id: string): Promise<void> {
  await apiDelete(`${BASE_URL}/${id}`);
}

export async function bulkSendOffers(ids: string[]): Promise<BulkSendOffersResult> {
  const res = await apiPost<ApiEnvelope<BulkSendOffersResult>>(`${BASE_URL}/bulk-send`, { ids });
  return res.data;
}

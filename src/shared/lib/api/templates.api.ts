import { apiDelete, apiGet, apiPost, apiPut, fetchWithRefresh } from '../api-client';

const BASE_URL = '/api/v1/templates';

interface ApiEnvelope<T> {
  data: T;
}

export interface OfferTemplate {
  id: string;
  companyId?: string;
  name: string;
  content?: string;
  emailSubject?: string;
  emailBody?: string;
  emailHeaderConfig?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateBrandingPreview {
  name?: string;
  website?: string;
  logoUrl?: string;
  senderEmail?: string;
  senderName?: string;
  emailHeaderConfig?: string;
}

export interface TemplatePreviewOfferLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discount: number;
}

export interface TemplatePreviewOffer {
  title?: string;
  priceDisplayMode?: 'exclusive' | 'inclusive';
  recipientName?: string;
  recipientEmail?: string;
  recipientCompany?: string;
  notes?: string;
  lineItems?: TemplatePreviewOfferLineItem[];
}

export interface CreateTemplatePayload {
  name: string;
  companyId: string;
  content: string;
  emailSubject?: string;
  emailBody?: string;
  emailHeaderConfig?: string;
}

export type UpdateTemplatePayload = Partial<CreateTemplatePayload>;

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function readApiError(response: Response, fallback: string) {
  const contentType = response.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/problem+json')) {
      const problem = await response.json() as { detail?: string; title?: string };
      return problem.detail ?? problem.title ?? fallback;
    }

    if (contentType.includes('application/json')) {
      const json = await response.json() as {
        detail?: string;
        title?: string;
        error?: { message?: string };
        data?: { message?: string };
      };
      return json.detail ?? json.title ?? json.error?.message ?? json.data?.message ?? fallback;
    }

    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

export async function listTemplates(params: { companyId?: string } = {}): Promise<OfferTemplate[]> {
  const res = await apiGet<ApiEnvelope<OfferTemplate[]>>(`${BASE_URL}${query(params)}`);
  return res.data;
}

export async function getTemplate(id: string): Promise<OfferTemplate> {
  const res = await apiGet<ApiEnvelope<OfferTemplate>>(`${BASE_URL}/${id}`);
  return res.data;
}

export async function createTemplate(payload: CreateTemplatePayload): Promise<OfferTemplate> {
  const res = await apiPost<ApiEnvelope<OfferTemplate>>(BASE_URL, payload);
  return res.data;
}

export async function updateTemplate(id: string, payload: UpdateTemplatePayload): Promise<OfferTemplate> {
  const res = await apiPut<ApiEnvelope<OfferTemplate>>(`${BASE_URL}/${id}`, payload);
  return res.data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiDelete(`${BASE_URL}/${id}`);
}

export async function previewTemplate(payload: {
  content?: string;
  branding?: TemplateBrandingPreview;
  offer?: TemplatePreviewOffer;
}): Promise<string> {
  const res = await apiPost<{ html?: string }>(`${BASE_URL}/preview`, payload);
  return res.html ?? '';
}

export async function uploadTemplateAsset(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetchWithRefresh(`${BASE_URL}/assets`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await readApiError(res, `Bilduppladdning misslyckades (${res.status})`));
  }

  const json = await res.json().catch(() => ({})) as { url?: string };
  if (!json.url) {
    throw new Error('Bilduppladdning misslyckades. Servern returnerade ingen bildlänk.');
  }

  return json.url;
}

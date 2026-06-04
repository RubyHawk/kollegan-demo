import { apiGet } from '../api-client';

interface ApiEnvelope<T> {
  data: T;
}

export type RecipientSuggestionKind = 'customer' | 'lead';

export interface RecipientSuggestion {
  id: string;
  kind: RecipientSuggestionKind;
  label: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  companyId: string | null;
  leadId: string | null;
  customerId: string | null;
  address: string | null;
  postalCode: string | null;
  requestedService: string | null;
  sourceLabel: string | null;
  hasOffer: boolean;
  createdAt: string;
}

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listRecipientSuggestions(params: {
  search: string;
  companyId?: string | null;
  limit?: number;
}): Promise<RecipientSuggestion[]> {
  const res = await apiGet<ApiEnvelope<{ suggestions: RecipientSuggestion[] }>>(
    `/api/v1/crm/recipient-suggestions${query(params)}`,
  );
  return res.data.suggestions;
}

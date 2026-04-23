import { apiDelete, apiGet, apiPatch, apiPost, fetchWithRefresh } from '../api-client';

const BASE_URL = '/api/v1/companies';

interface ApiEnvelope<T> {
  data: T;
}

export interface Company {
  id: string;
  organizationId: string;
  name: string;
  orgNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  region?: string;
  country?: string;
  website?: string;
  logoUrl?: string;
  senderEmail?: string;
  senderName?: string;
  emailHeaderConfig?: string;
  industry?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyMemberUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  role: 'staff' | 'admin';
  createdAt: string;
  grantedBy?: string;
  user: CompanyMemberUser;
}

export interface AssignableCompanyUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface CreateCompanyPayload {
  name: string;
  orgNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  region?: string;
  country?: string;
  website?: string;
  logoUrl?: string;
  senderEmail?: string;
  senderName?: string;
  emailHeaderConfig?: string;
  industry?: string;
  notes?: string;
}

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;

export class CompanyApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'CompanyApiError';
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

async function requestJson<T>(url: string, init?: RequestInit, fallback = 'Kunde inte hämta företag'): Promise<T> {
  const res = await fetchWithRefresh(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    throw new CompanyApiError(res.status, await readApiError(res, fallback));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

async function readApiError(response: Response, fallback: string) {
  const contentType = response.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/problem+json')) {
      const problem = await response.json() as { detail?: string; title?: string };
      return problem.detail ?? problem.title ?? fallback;
    }

    if (contentType.includes('application/json')) {
      const json = await response.json() as { detail?: string; title?: string; error?: { message?: string } };
      return json.detail ?? json.title ?? json.error?.message ?? fallback;
    }

    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

export async function listCompanies(params: { search?: string; limit?: number; offset?: number } = {}): Promise<Company[]> {
  const res = await apiGet<ApiEnvelope<{ companies: Company[] }>>(`${BASE_URL}${query(params)}`);
  return res.data.companies;
}

export async function createCompany(payload: CreateCompanyPayload): Promise<Company> {
  const res = await apiPost<ApiEnvelope<Company>>(BASE_URL, payload);
  return res.data;
}

export async function updateCompany(id: string, payload: UpdateCompanyPayload): Promise<Company> {
  const res = await apiPatch<ApiEnvelope<Company>>(`${BASE_URL}/${id}`, payload);
  return res.data;
}

export async function deleteCompany(id: string): Promise<void> {
  await apiDelete(`${BASE_URL}/${id}`);
}

export async function listCompanyMembers(companyId: string): Promise<{
  members: CompanyMember[];
  availableUsers: AssignableCompanyUser[];
}> {
  const res = await requestJson<ApiEnvelope<{
    members: CompanyMember[];
    availableUsers: AssignableCompanyUser[];
  }>>(`${BASE_URL}/${companyId}/members`, undefined, 'Kunde inte hämta användarkopplingar');
  return res.data;
}

export async function upsertCompanyMember(
  companyId: string,
  payload: { userId: string; role: 'staff' | 'admin' } | {
    mode: 'create';
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: 'staff' | 'admin';
  },
): Promise<CompanyMember> {
  const res = await requestJson<ApiEnvelope<CompanyMember>>(`${BASE_URL}/${companyId}/members`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, 'Kunde inte spara användarkopplingen');
  return res.data;
}

export async function removeCompanyMember(companyId: string, userId: string): Promise<void> {
  await requestJson<ApiEnvelope<null>>(
    `${BASE_URL}/${companyId}/members${query({ userId })}`,
    { method: 'DELETE' },
    'Kunde inte ta bort användarkopplingen',
  );
}

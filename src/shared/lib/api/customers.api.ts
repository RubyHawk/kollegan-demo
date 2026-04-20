import { apiDelete, apiGet, apiPatch, apiPost } from '../api-client';

const BASE_URL = '/api/v1/kunder';

interface ApiEnvelope<T> {
  data: T;
}

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  convertedFromLeadId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CustomerContact extends Customer {
  callCount: number;
  firstSeen: string;
  lastSeen: string;
}

export interface ListCustomersParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateCustomerPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listCustomers(params: ListCustomersParams = {}) {
  const res = await apiGet<ApiEnvelope<{
    contacts: CustomerContact[];
    customers: Customer[];
    total: number;
    limit: number;
    offset: number;
  }>>(`${BASE_URL}${query(params)}`);
  return res.data;
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<CustomerContact> {
  const res = await apiPost<ApiEnvelope<{ customer: Customer; contact: CustomerContact }>>(BASE_URL, payload);
  return res.data.contact;
}

export async function getCustomer(id: string): Promise<Customer> {
  const res = await apiGet<ApiEnvelope<{ customer: Customer; contact: CustomerContact }>>(`${BASE_URL}/${id}`);
  return res.data.customer;
}

export async function updateCustomer(id: string, payload: UpdateCustomerPayload): Promise<CustomerContact> {
  const res = await apiPatch<ApiEnvelope<{ customer: Customer; contact: CustomerContact }>>(`${BASE_URL}/${id}`, payload);
  return res.data.contact;
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiDelete(`${BASE_URL}/${id}`);
}

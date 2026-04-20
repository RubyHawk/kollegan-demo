import { apiDelete, apiGet, apiPatch, apiPost } from '../api-client';

const SUPPLIERS_BASE_URL = '/api/v1/leverantorer';

interface ApiEnvelope<T> {
  data: T;
}

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  orgNumber: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
}

export interface ListSuppliersParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateSupplierPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
  orgNumber?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
}

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listSuppliers(params: ListSuppliersParams = {}) {
  const res = await apiGet<ApiEnvelope<{
    suppliers: Supplier[];
    total: number;
    limit: number;
    offset: number;
  }>>(`${SUPPLIERS_BASE_URL}${query(params)}`);
  return res.data;
}

export async function createSupplier(payload: CreateSupplierPayload): Promise<Supplier> {
  const res = await apiPost<ApiEnvelope<{ supplier: Supplier }>>(SUPPLIERS_BASE_URL, payload);
  return res.data.supplier;
}

export async function updateSupplier(id: string, payload: UpdateSupplierPayload): Promise<Supplier> {
  const res = await apiPatch<ApiEnvelope<{ supplier: Supplier }>>(`${SUPPLIERS_BASE_URL}/${id}`, payload);
  return res.data.supplier;
}

export async function deleteSupplier(id: string): Promise<void> {
  await apiDelete(`${SUPPLIERS_BASE_URL}/${id}`);
}

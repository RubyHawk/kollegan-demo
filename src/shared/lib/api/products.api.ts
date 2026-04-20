import { fetchWithRefresh } from '../api-client';

const BASE_URL = '/api/v1/offers/products';
const CATEGORIES_URL = `${BASE_URL}/categories`;

interface ApiEnvelope<T> {
  data: T;
}

export interface ProductCategory {
  id: string;
  organizationId: string;
  companyId?: string;
  name: string;
  parentId: string | null;
  children?: ProductCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface OfferProduct {
  id: string;
  organizationId: string;
  companyId?: string;
  name: string;
  description?: string;
  unitPrice: number;
  vatRate: number;
  unit?: string;
  sku?: string;
  category?: string;
  categoryId?: string;
  imageUrl?: string;
  isActive: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  createdBy: string;
  createdAt: string;
}

export interface ListProductsParams {
  search?: string;
  category?: string;
  isActive?: boolean;
  companyId?: string;
}

export interface CreateProductPayload {
  name: string;
  companyId?: string | null;
  description?: string;
  unitPrice: number;
  vatRate?: number;
  unit?: string;
  sku?: string;
  category?: string;
  categoryId?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  minQuantity?: number | null;
  maxQuantity?: number | null;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface ProductCategoryPayload {
  companyId?: string | null;
  name?: string;
  parentId?: string | null;
}

export class ProductApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ProductApiError';
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

async function requestJson<T>(url: string, init?: RequestInit, fallback = 'Serverfel'): Promise<T> {
  const res = await fetchWithRefresh(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    throw new ProductApiError(res.status, await readApiError(res, fallback));
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

export async function listProducts(params: ListProductsParams = {}): Promise<OfferProduct[]> {
  const res = await requestJson<ApiEnvelope<{ products: OfferProduct[] }>>(
    `${BASE_URL}${query({ ...params, isActive: params.isActive === undefined ? undefined : String(params.isActive) })}`,
    undefined,
    'Kunde inte hämta produkter',
  );
  return res.data.products;
}

export async function listProductCategories(params: { companyId?: string } = {}): Promise<ProductCategory[]> {
  const res = await requestJson<ApiEnvelope<{ categories: ProductCategory[] }>>(
    `${CATEGORIES_URL}${query(params)}`,
    undefined,
    'Kunde inte hämta kategorier',
  );
  return res.data.categories;
}

export async function createProductCategory(payload: ProductCategoryPayload): Promise<ProductCategory> {
  const res = await requestJson<ApiEnvelope<ProductCategory>>(CATEGORIES_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, 'Kunde inte skapa kategori');
  return res.data;
}

export async function updateProductCategory(id: string, payload: ProductCategoryPayload): Promise<ProductCategory> {
  const res = await requestJson<ApiEnvelope<ProductCategory>>(`${CATEGORIES_URL}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, 'Kunde inte uppdatera kategorin');
  return res.data;
}

export async function deleteProductCategory(id: string): Promise<void> {
  await requestJson<ApiEnvelope<null>>(`${CATEGORIES_URL}/${id}`, { method: 'DELETE' }, 'Kunde inte ta bort kategorin');
}

export async function createProduct(payload: CreateProductPayload): Promise<OfferProduct> {
  const res = await requestJson<ApiEnvelope<OfferProduct>>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, 'Kunde inte spara produkten');
  return res.data;
}

export async function updateProduct(id: string, payload: UpdateProductPayload): Promise<OfferProduct> {
  const res = await requestJson<ApiEnvelope<OfferProduct>>(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, 'Kunde inte uppdatera produkten');
  return res.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await requestJson<ApiEnvelope<null>>(`${BASE_URL}/${id}`, { method: 'DELETE' }, 'Kunde inte ta bort produkten');
}

const API_V1_BASE = '/api/v1';

export function companyLocation(companyId: string): string {
  return `${API_V1_BASE}/companies/${companyId}`;
}

export function offerLocation(offerId: string): string {
  return `${API_V1_BASE}/offers/${offerId}`;
}

export function productLocation(productId: string): string {
  return `${API_V1_BASE}/offers/products/${productId}`;
}

export function productCategoryLocation(categoryId: string): string {
  return `${API_V1_BASE}/offers/products/categories/${categoryId}`;
}

export function templateLocation(templateId: string): string {
  return `${API_V1_BASE}/templates/${templateId}`;
}

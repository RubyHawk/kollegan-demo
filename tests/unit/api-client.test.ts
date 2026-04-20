import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiDelete, apiGet } from '../../src/shared/lib/api-client';
import { removeCompanyMember } from '../../src/shared/lib/api/companies.api';
import { deleteProduct, deleteProductCategory } from '../../src/shared/lib/api/products.api';

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(response: Response) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
}

describe('api-client', () => {
  it('uses problem detail as the thrown API error message', async () => {
    mockFetch(new Response(JSON.stringify({
      type: 'about:blank',
      title: 'Ogiltig begaran',
      detail: 'Projektet saknar inkopsorder.',
      status: 422,
    }), {
      status: 422,
      headers: { 'content-type': 'application/problem+json' },
    }));

    await expect(apiGet('/api/v1/projekt/project_1')).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      message: 'Projektet saknar inkopsorder.',
    });
  });

  it('uses JSON error messages for delete failures', async () => {
    mockFetch(new Response(JSON.stringify({ error: { message: 'Kunde inte ta bort posten.' } }), {
      status: 409,
      headers: { 'content-type': 'application/json' },
    }));

    await expect(apiDelete('/api/v1/companies/company_1')).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: 'Kunde inte ta bort posten.',
    });
  });
});

describe('feature API clients', () => {
  it('treats successful member removal 204 responses as empty success', async () => {
    mockFetch(new Response(null, { status: 204 }));

    await expect(removeCompanyMember(
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    )).resolves.toBeUndefined();
  });

  it('treats successful product delete 204 responses as empty success', async () => {
    mockFetch(new Response(null, { status: 204 }));

    await expect(deleteProduct('product_1')).resolves.toBeUndefined();
  });

  it('treats successful product category delete 204 responses as empty success', async () => {
    mockFetch(new Response(null, { status: 204 }));

    await expect(deleteProductCategory('category_1')).resolves.toBeUndefined();
  });
});

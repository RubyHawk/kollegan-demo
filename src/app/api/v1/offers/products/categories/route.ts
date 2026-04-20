import type { NextRequest } from 'next/server';
import {
  handleCreateProductCategory,
  handleListProductCategories,
} from '@modules/supporting/offers';

export const GET = handleListProductCategories;

function withV1ProductCategoryLocation(response: Response): Response {
  const location = response.headers.get('Location');
  if (!location?.startsWith('/api/offers/products/categories/')) return response;

  const headers = new Headers(response.headers);
  headers.set(
    'Location',
    location.replace('/api/offers/products/categories/', '/api/v1/offers/products/categories/'),
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return withV1ProductCategoryLocation(await handleCreateProductCategory(req));
}

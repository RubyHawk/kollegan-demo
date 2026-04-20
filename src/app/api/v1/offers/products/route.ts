import type { NextRequest } from 'next/server';
import {
  handleCreateProduct,
  handleListProducts,
} from '@modules/supporting/offers';

export const GET = handleListProducts;

function withV1ProductLocation(response: Response): Response {
  const location = response.headers.get('Location');
  if (!location?.startsWith('/api/offers/products/')) return response;

  const headers = new Headers(response.headers);
  headers.set('Location', location.replace('/api/offers/products/', '/api/v1/offers/products/'));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return withV1ProductLocation(await handleCreateProduct(req));
}

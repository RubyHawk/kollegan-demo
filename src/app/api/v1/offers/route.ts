import type { NextRequest } from 'next/server';
import {
  handleCreateOffer,
  handleListOffers,
} from '@modules/supporting/offers';

export const GET = handleListOffers;

function withV1OfferLocation(response: Response): Response {
  const location = response.headers.get('Location');
  if (!location?.startsWith('/api/offers/')) return response;

  const headers = new Headers(response.headers);
  headers.set('Location', location.replace('/api/offers/', '/api/v1/offers/'));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return withV1OfferLocation(await handleCreateOffer(req));
}

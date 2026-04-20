import type { NextRequest } from 'next/server';
import {
  handleCreateCompany,
  handleListCompanies,
} from '@modules/supporting/offers';

export const GET = handleListCompanies;

function withV1CompanyLocation(response: Response): Response {
  const location = response.headers.get('Location');
  if (!location?.startsWith('/api/companies/')) return response;

  const headers = new Headers(response.headers);
  headers.set('Location', location.replace('/api/companies/', '/api/v1/companies/'));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return withV1CompanyLocation(await handleCreateCompany(req));
}

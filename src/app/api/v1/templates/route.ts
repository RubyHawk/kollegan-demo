import type { NextRequest } from 'next/server';
import {
  handleCreateTemplate,
  handleListTemplates,
} from '@modules/supporting/offers';

export const GET = handleListTemplates;

function withV1TemplateLocation(response: Response): Response {
  const location = response.headers.get('Location');
  if (!location?.startsWith('/api/templates/')) return response;

  const headers = new Headers(response.headers);
  headers.set('Location', location.replace('/api/templates/', '/api/v1/templates/'));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return withV1TemplateLocation(await handleCreateTemplate(req));
}

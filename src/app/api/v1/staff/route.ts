import { NextResponse, type NextRequest } from 'next/server';
import { GET, DELETE, POST as legacyPost } from '../../staff/route';

export { GET, DELETE };

export async function POST(req: NextRequest) {
  const response = await legacyPost(req);
  const location = response.headers.get('Location');

  if (!location?.startsWith('/api/staff')) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('Location', location.replace('/api/staff', '/api/v1/staff'));

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

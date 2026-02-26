import { NextResponse } from 'next/server';
import { openApiSpec } from '@core/api/openapi';

export const dynamic = 'force-dynamic';

/** Serves the OpenAPI 3.1 JSON spec at GET /api/docs */
export function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}

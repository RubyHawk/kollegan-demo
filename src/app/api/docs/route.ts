import { NextResponse } from 'next/server';
import { openApiSpec } from '@platform/api/openapi';

export const dynamic = 'force-dynamic';

/** Serves the OpenAPI 3.1 JSON spec at GET /api/docs */
export function GET() {
  // No inline CORS override — let next.config.ts whitelist handle it.
  return NextResponse.json(openApiSpec);
}

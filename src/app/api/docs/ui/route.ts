import { ApiReference } from '@scalar/nextjs-api-reference';

export const dynamic = 'force-dynamic';

/** Scalar API Reference — served at GET /api/docs/ui */
export const GET = ApiReference({
  url: '/api/docs',
  theme: 'purple',
  defaultHttpClient: { targetKey: 'js', clientKey: 'fetch' },
});

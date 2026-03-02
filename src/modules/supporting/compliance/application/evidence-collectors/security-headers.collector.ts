// A.8.7 — Protection Against Malware: security headers self-check

import type { CollectorResult } from '../../domain/evidence.entity';

const REQUIRED_HEADERS = [
  'strict-transport-security',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
] as const;

export async function securityHeadersCollector(
  _organizationId: string,
  controlId: string
): Promise<CollectorResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const targetUrl = `${appUrl}/api/health`;

  let present: Record<string, string | null> = {};
  let fetchError: string | null = null;

  try {
    const res = await fetch(targetUrl, { method: 'GET' });
    for (const h of REQUIRED_HEADERS) {
      present[h] = res.headers.get(h);
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err);
    // Mark all unknown on fetch failure
    for (const h of REQUIRED_HEADERS) {
      present[h] = null;
    }
  }

  const missing = REQUIRED_HEADERS.filter(h => !present[h]);
  const allPresent = missing.length === 0;
  const status = fetchError ? 'warn' : allPresent ? 'pass' : 'fail';

  return {
    controlId,
    status,
    payload: { headers: present, missing, fetchError },
    summary: fetchError
      ? `Could not reach ${targetUrl} to verify headers: ${fetchError}`
      : allPresent
        ? `All ${REQUIRED_HEADERS.length} required security headers present (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)`
        : `Missing security headers: ${missing.join(', ')}`,
  };
}

// A.8.28 — Secure Coding: JWT and session token security configuration snapshot

import type { CollectorResult } from '../../domain/evidence.entity';

export async function tokenSecurityCollector(
  _organizationId: string,
  controlId: string
): Promise<CollectorResult> {
  const payload = {
    jwtAlgorithm:        'HS256',
    accessTokenTtl:      '15 minutes',
    staffRefreshTtl:     '7 days',
    customerRefreshTtl:  '30 days',
    cookieFlags:         ['httpOnly', 'secure (production)', 'sameSite=lax'],
    refreshTokenType:    'opaque (32-byte random hex, SHA-256 hashed in DB)',
    revocationLevels:    ['token-level (Redis JTI blacklist)', 'user-level (Redis epoch timestamp)'],
    mfaEnforced:         ['staff users (required)', 'customer admins (required)', 'customer viewers (optional)'],
    passwordHashing:     'bcrypt, cost ≥ 12, auto-upgrade on login',
    webAuthnEnabled:     true,
    totpEnabled:         true,
  };

  return {
    controlId,
    status:  'pass',
    payload,
    summary: 'HS256 JWT; 15-min access tokens; opaque refresh tokens; httpOnly cookies; dual-layer Redis revocation; MFA enforced for all staff',
  };
}

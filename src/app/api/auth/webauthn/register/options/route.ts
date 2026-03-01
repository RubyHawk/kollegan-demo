/**
 * POST /api/auth/webauthn/register/options
 *
 * Start passkey registration ceremony for the authenticated user.
 * Returns WebAuthn PublicKeyCredentialCreationOptions JSON.
 * The challenge is stored in Redis (5 min TTL).
 *
 * Requires: JWT auth.
 */

import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok } from '@core/api/response';
import { verifyToken } from '@core/auth/jwt';
import { beginRegistration } from '@modules/supporting/auth';

export const POST = createHandler(
  { auth: 'jwt', tag: 'WebAuthn:RegisterOptions', rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value
      ?? req.cookies.get('portal_token')?.value
      ?? '';
    const payload = await verifyToken(token);

    const options = await beginRegistration(payload.sub, String(payload['email'] ?? payload.sub));

    return ok(options);
  }
);

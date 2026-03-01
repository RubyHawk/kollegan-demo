/**
 * POST /api/auth/webauthn/register/verify
 *
 * Complete passkey registration ceremony.
 * Consumes the challenge from Redis, verifies the authenticator response,
 * and stores the new credential.
 *
 * Requires: JWT auth.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { completeRegistration } from '@modules/supporting/auth';
import type { RegistrationResponseJSON } from '@simplewebauthn/browser';

const BodySchema = z.object({
  response: z.record(z.string(), z.unknown()), // RegistrationResponseJSON shape
  name: z.string().min(1).max(64).default('Passkey'),
});

export const POST = createHandler(
  { auth: 'jwt', tag: 'WebAuthn:RegisterVerify', body: BodySchema, rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: { response: Record<string, unknown>; name: string }; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value
      ?? req.cookies.get('portal_token')?.value
      ?? '';
    const payload = await verifyToken(token);

    try {
      const result = await completeRegistration(
        payload.sub,
        body.response as unknown as RegistrationResponseJSON,
        body.name,
      );
      return ok({ credentialId: result.credentialId, message: 'Passkey registered successfully.' });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'CHALLENGE_EXPIRED') throw Errors.badRequest('Registration challenge expired — please start again');
      if (code === 'WEBAUTHN_FAILED') throw Errors.unauthorized('Passkey verification failed');
      throw err;
    }
  }
);

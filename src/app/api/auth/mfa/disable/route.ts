/**
 * POST /api/auth/mfa/disable
 *
 * Disable MFA for the authenticated user. Requires a valid TOTP code or backup code.
 *
 * Requires: JWT auth.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { disableMfa } from '@modules/supporting/auth';

const BodySchema = z.object({
  code: z.string().min(1).max(20),
});

export const POST = createHandler(
  { auth: 'jwt', tag: 'MFA:Disable', body: BodySchema, rateLimit: { max: 5, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof BodySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value
      ?? req.cookies.get('portal_token')?.value
      ?? '';
    const payload = await verifyToken(token);

    try {
      await disableMfa(payload.sub, body.code);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'INVALID_CODE') throw Errors.unauthorized('Invalid code');
      throw err;
    }

    return ok({ message: 'MFA has been disabled.' });
  }
);

/**
 * POST /api/auth/mfa/enable
 *
 * Finalise TOTP enrolment. Verifies the user's first TOTP code, sets mfaEnabled=true,
 * and generates backup codes. Returns the backup codes (shown to user exactly once).
 *
 * Requires: JWT auth.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { enableTotp } from '@modules/supporting/auth';

const BodySchema = z.object({
  code: z.string().min(6).max(8),
});

export const POST = createHandler(
  { auth: 'jwt', tag: 'MFA:Enable', body: BodySchema, rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof BodySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value
      ?? req.cookies.get('portal_token')?.value
      ?? '';
    const payload = await verifyToken(token);

    let backupCodes: string[];
    try {
      backupCodes = await enableTotp(payload.sub, body.code);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'INVALID_TOTP') throw Errors.unauthorized('Invalid TOTP code — check your authenticator app and try again');
      throw err;
    }

    return ok({ backupCodes, message: 'MFA enabled. Store these backup codes safely — they will not be shown again.' });
  }
);

/**
 * POST /api/auth/mfa/backup-codes/regenerate
 *
 * Burn all existing backup codes and issue 10 new ones.
 * Requires a valid TOTP code (MFA must be enabled).
 *
 * Requires: JWT auth + MFA.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { regenerateBackupCodes } from '@modules/supporting/auth';

const BodySchema = z.object({
  totpCode: z.string().min(6).max(8),
});

export const POST = createHandler(
  { auth: 'jwt', tag: 'MFA:RegenerateBackupCodes', body: BodySchema, requireMfa: true, rateLimit: { max: 5, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof BodySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value
      ?? req.cookies.get('portal_token')?.value
      ?? '';
    const payload = await verifyToken(token);

    let backupCodes: string[];
    try {
      backupCodes = await regenerateBackupCodes(payload.sub, body.totpCode);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'INVALID_TOTP') throw Errors.unauthorized('Invalid TOTP code');
      throw err;
    }

    return ok({ backupCodes, message: 'Backup codes regenerated. Store these safely — they will not be shown again.' });
  }
);

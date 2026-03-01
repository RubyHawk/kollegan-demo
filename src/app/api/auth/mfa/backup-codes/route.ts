/**
 * GET /api/auth/mfa/backup-codes
 *
 * Returns the number of remaining backup codes for the authenticated user.
 * Never returns the codes themselves — they were shown on creation only.
 *
 * Requires: JWT auth.
 */

import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok } from '@core/api/response';
import { verifyToken } from '@core/auth/jwt';
import { getBackupCodeCount } from '@modules/supporting/auth';

export const GET = createHandler(
  { auth: 'jwt', tag: 'MFA:BackupCodes', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value
      ?? req.cookies.get('portal_token')?.value
      ?? '';
    const payload = await verifyToken(token);
    const remaining = await getBackupCodeCount(payload.sub);
    return ok({ remaining });
  }
);

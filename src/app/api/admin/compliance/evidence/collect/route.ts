/**
 * POST /api/admin/compliance/evidence/collect
 *
 * Manually triggers evidence collection for the authenticated org.
 * Runs synchronously in Phase 1 — returns once all collectors complete.
 *
 * Requires: JWT auth + requireMfa + admin role.
 */

import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { collectAllEvidence } from '@modules/supporting/compliance';

export const POST = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Evidence:Collect', requireMfa: true, rateLimit: { max: 5, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value
      ?? '';
    const payload = await verifyToken(token);

    const isAdmin = payload.roles.includes('super_admin') || payload.roles.includes('admin');
    if (!isAdmin) throw Errors.forbidden('Evidence collection requires admin role');

    const orgId = payload.orgId;
    if (!orgId) throw Errors.forbidden('Organization context required');

    const summary = await collectAllEvidence(orgId, payload.sub);

    return ok(summary);
  }
);

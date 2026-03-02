/**
 * GET /api/admin/compliance/controls
 *
 * Returns all 13 ISO 27001 Annex A controls with their latest evidence
 * snapshot for the authenticated user's organization.
 *
 * Requires: JWT auth + requireMfa + admin or super_admin role.
 */

import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { listControlsWithStatus } from '@modules/supporting/compliance';

export const GET = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Controls', requireMfa: true, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value
      ?? '';
    const payload = await verifyToken(token);

    const isAdmin = payload.roles.includes('super_admin') || payload.roles.includes('admin');
    if (!isAdmin) throw Errors.forbidden('Compliance controls require admin role');

    const orgId = payload.orgId;
    if (!orgId) throw Errors.forbidden('Organization context required');

    const controls = await listControlsWithStatus(orgId);
    return ok({ controls, total: controls.length });
  }
);

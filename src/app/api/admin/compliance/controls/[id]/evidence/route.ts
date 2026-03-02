/**
 * GET /api/admin/compliance/controls/:id/evidence
 *
 * Returns evidence history for a specific control.
 * :id is the ComplianceControl UUID (from GET /controls).
 *
 * Query params:
 *   limit  — number of snapshots to return (default 20)
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { getControlWithEvidence } from '@modules/supporting/compliance';

const QuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const GET = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:ControlEvidence', requireMfa: true, query: QuerySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req, query } = ctx as { req: NextRequest; query: { limit?: number } };
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value
      ?? '';
    const payload = await verifyToken(token);

    const isAdmin = payload.roles.includes('super_admin') || payload.roles.includes('admin');
    if (!isAdmin) throw Errors.forbidden('Compliance controls require admin role');

    const orgId = payload.orgId;
    if (!orgId) throw Errors.forbidden('Organization context required');

    // Extract :id from URL
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf('controls') + 1];

    const result = await getControlWithEvidence(id, orgId, query?.limit ?? 20);
    if (!result) throw Errors.notFound('Control not found');

    return ok(result);
  }
);

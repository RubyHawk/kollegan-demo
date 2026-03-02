/**
 * GET /api/admin/compliance/report
 *
 * Returns a complete ISO 27001 evidence package as a JSON download.
 * Intended for auditors (BSI, Bureau Veritas, etc.).
 *
 * Requires: JWT auth + requireMfa + admin role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { buildEvidencePackage } from '@modules/supporting/compliance';

export const GET = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Report', requireMfa: true, rateLimit: { max: 5, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value
      ?? '';
    const payload = await verifyToken(token);

    const isAdmin = payload.roles.includes('super_admin') || payload.roles.includes('admin');
    if (!isAdmin) throw Errors.forbidden('Compliance report requires admin role');

    const orgId = payload.orgId;
    if (!orgId) throw Errors.forbidden('Organization context required');

    const pkg = await buildEvidencePackage(orgId);

    // Return as a downloadable JSON file
    const date = new Date().toISOString().split('T')[0];
    return {
      ...ok(pkg),
      headers: {
        'Content-Disposition': `attachment; filename="iso27001-evidence-${date}.json"`,
      },
    };
  }
);

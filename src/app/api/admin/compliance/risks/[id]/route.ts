/**
 * PATCH  /api/admin/compliance/risks/:id  — update a risk
 * DELETE /api/admin/compliance/risks/:id  — soft delete a risk
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok, noContent } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { updateRisk, deleteRisk } from '@modules/supporting/compliance';

const PatchRiskSchema = z.object({
  asset:         z.string().min(1).max(500).optional(),
  threat:        z.string().min(1).max(500).optional(),
  vulnerability: z.string().min(1).max(500).optional(),
  likelihood:    z.number().int().min(1).max(5).optional(),
  impact:        z.number().int().min(1).max(5).optional(),
  treatment:     z.enum(['accept','mitigate','transfer','avoid']).optional(),
  treatmentDesc: z.string().max(2000).nullable().optional(),
  owner:         z.string().max(200).nullable().optional(),
  dueDate:       z.string().datetime().nullable().optional(),
  status:        z.enum(['open','in_progress','resolved','accepted']).optional(),
});

function extractId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/');
  return segments[segments.indexOf('risks') + 1];
}

async function getAdminOrgId(req: NextRequest): Promise<string> {
  const token = req.headers.get('authorization')?.slice(7)
    ?? req.cookies.get('token')?.value
    ?? '';
  const payload = await verifyToken(token);
  if (!payload.roles.includes('super_admin') && !payload.roles.includes('admin')) {
    throw Errors.forbidden('Compliance risks require admin role');
  }
  if (!payload.orgId) throw Errors.forbidden('Organization context required');
  return payload.orgId;
}

export const PATCH = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Risks:Update', requireMfa: true, body: PatchRiskSchema, rateLimit: { max: 20, windowMs: 60_000 } },
  async (ctx) => {
    const { req, body } = ctx as { req: NextRequest; body: z.infer<typeof PatchRiskSchema> };
    const orgId = await getAdminOrgId(req);
    const id    = extractId(req);

    const { dueDate: dueDateStr, ...rest } = body;
    const dueDate: Date | null | undefined = dueDateStr
      ? new Date(dueDateStr)
      : dueDateStr === null ? null : undefined;
    const updated = await updateRisk(id, orgId, { ...rest, dueDate });
    if (!updated) throw Errors.notFound('Risk not found');
    return ok(updated);
  }
);

export const DELETE = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Risks:Delete', requireMfa: true, rateLimit: { max: 20, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const orgId   = await getAdminOrgId(req);
    const id      = extractId(req);

    const deleted = await deleteRisk(id, orgId);
    if (!deleted) throw Errors.notFound('Risk not found');
    return noContent();
  }
);

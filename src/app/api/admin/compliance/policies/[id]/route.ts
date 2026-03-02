/**
 * PATCH  /api/admin/compliance/policies/:id
 * DELETE /api/admin/compliance/policies/:id
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok, noContent } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { updatePolicy, deletePolicy } from '@modules/supporting/compliance';

const PatchPolicySchema = z.object({
  name:            z.string().min(1).max(200).optional(),
  category:        z.string().min(1).max(100).optional(),
  content:         z.string().max(100_000).optional(),
  version:         z.string().max(20).optional(),
  reviewCycleDays: z.number().int().min(30).max(730).optional(),
  nextReviewDate:  z.string().datetime().nullable().optional(),
  owner:           z.string().max(200).nullable().optional(),
  approvedBy:      z.string().uuid().nullable().optional(),
  status:          z.enum(['draft','active','retired']).optional(),
});

function extractId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/');
  return segments[segments.indexOf('policies') + 1];
}

async function getAdminOrgId(req: NextRequest): Promise<{ orgId: string; userId: string }> {
  const token = req.headers.get('authorization')?.slice(7)
    ?? req.cookies.get('token')?.value
    ?? '';
  const payload = await verifyToken(token);
  if (!payload.roles.includes('super_admin') && !payload.roles.includes('admin')) {
    throw Errors.forbidden('Compliance policies require admin role');
  }
  if (!payload.orgId) throw Errors.forbidden('Organization context required');
  return { orgId: payload.orgId, userId: payload.sub };
}

export const PATCH = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Policies:Update', requireMfa: true, body: PatchPolicySchema, rateLimit: { max: 20, windowMs: 60_000 } },
  async (ctx) => {
    const { req, body } = ctx as { req: NextRequest; body: z.infer<typeof PatchPolicySchema> };
    const { orgId, userId } = await getAdminOrgId(req);
    const id = extractId(req);

    const { nextReviewDate: nrdStr, approvedBy, ...rest } = body;
    const nextReviewDate: Date | null | undefined = nrdStr
      ? new Date(nrdStr)
      : nrdStr === null ? null : undefined;
    const updates = {
      ...rest,
      nextReviewDate,
      approvedAt: approvedBy ? new Date() : undefined,
      approvedBy: approvedBy ?? undefined,
    };

    void userId; // available for audit log if needed in future

    const updated = await updatePolicy(id, orgId, updates);
    if (!updated) throw Errors.notFound('Policy not found');
    return ok(updated);
  }
);

export const DELETE = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Policies:Delete', requireMfa: true, rateLimit: { max: 20, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const { orgId } = await getAdminOrgId(req);
    const id = extractId(req);

    const deleted = await deletePolicy(id, orgId);
    if (!deleted) throw Errors.notFound('Policy not found');
    return noContent();
  }
);

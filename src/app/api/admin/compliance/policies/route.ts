/**
 * GET  /api/admin/compliance/policies  — list policies
 * POST /api/admin/compliance/policies  — create a policy
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok, created, paginated } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { listPolicies, createPolicy } from '@modules/supporting/compliance';

const QuerySchema = z.object({
  status: z.enum(['draft','active','retired']).optional(),
  limit:  z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const CreatePolicySchema = z.object({
  name:             z.string().min(1).max(200),
  category:         z.string().min(1).max(100),
  content:          z.string().max(100_000),
  version:          z.string().max(20).optional(),
  reviewCycleDays:  z.number().int().min(30).max(730).optional(),
  owner:            z.string().max(200).optional(),
});

async function getAdminContext(req: NextRequest): Promise<{ orgId: string; userId: string }> {
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

export const GET = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Policies:List', requireMfa: true, query: QuerySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req, query } = ctx as { req: NextRequest; query: z.infer<typeof QuerySchema> };
    const { orgId } = await getAdminContext(req);

    const limit  = query?.limit  ?? 50;
    const offset = query?.offset ?? 0;
    const { items, total } = await listPolicies(orgId, { status: query?.status, limit, offset });

    return paginated(items, { total, count: items.length, hasNext: offset + limit < (total ?? 0), hasPrev: offset > 0 });
  }
);

export const POST = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Policies:Create', requireMfa: true, body: CreatePolicySchema, rateLimit: { max: 20, windowMs: 60_000 } },
  async (ctx) => {
    const { req, body } = ctx as { req: NextRequest; body: z.infer<typeof CreatePolicySchema> };
    const { orgId, userId } = await getAdminContext(req);

    const policy = await createPolicy({
      organizationId:  orgId,
      name:            body.name,
      category:        body.category,
      content:         body.content,
      version:         body.version,
      reviewCycleDays: body.reviewCycleDays,
      owner:           body.owner,
      createdBy:       userId,
    });

    return created(policy, `/api/admin/compliance/policies/${policy.id}`);
  }
);

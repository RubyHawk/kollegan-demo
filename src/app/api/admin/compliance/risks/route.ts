/**
 * GET  /api/admin/compliance/risks  — list risks (paginated)
 * POST /api/admin/compliance/risks  — create a new risk
 *
 * Requires: JWT auth + requireMfa + admin role.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok, created, paginated } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { listRisks, createRisk } from '@modules/supporting/compliance';

const QuerySchema = z.object({
  status: z.enum(['open','in_progress','resolved','accepted']).optional(),
  limit:  z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const CreateRiskSchema = z.object({
  asset:         z.string().min(1).max(500),
  threat:        z.string().min(1).max(500),
  vulnerability: z.string().min(1).max(500),
  likelihood:    z.number().int().min(1).max(5),
  impact:        z.number().int().min(1).max(5),
  treatment:     z.enum(['accept','mitigate','transfer','avoid']),
  treatmentDesc: z.string().max(2000).optional(),
  owner:         z.string().max(200).optional(),
  dueDate:       z.string().datetime().optional(),
});

async function getAdminOrgId(req: NextRequest): Promise<{ orgId: string; userId: string }> {
  const token = req.headers.get('authorization')?.slice(7)
    ?? req.cookies.get('token')?.value
    ?? '';
  const payload = await verifyToken(token);
  const isAdmin = payload.roles.includes('super_admin') || payload.roles.includes('admin');
  if (!isAdmin) throw Errors.forbidden('Compliance risks require admin role');
  if (!payload.orgId) throw Errors.forbidden('Organization context required');
  return { orgId: payload.orgId, userId: payload.sub };
}

export const GET = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Risks:List', requireMfa: true, query: QuerySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req, query } = ctx as { req: NextRequest; query: z.infer<typeof QuerySchema> };
    const { orgId } = await getAdminOrgId(req);

    const limit  = query?.limit  ?? 50;
    const offset = query?.offset ?? 0;
    const { items, total } = await listRisks(orgId, { status: query?.status, limit, offset });

    return paginated(items, { total, count: items.length, hasNext: offset + limit < (total ?? 0), hasPrev: offset > 0 });
  }
);

export const POST = createHandler(
  { auth: 'jwt', tag: 'Admin:Compliance:Risks:Create', requireMfa: true, body: CreateRiskSchema, rateLimit: { max: 20, windowMs: 60_000 } },
  async (ctx) => {
    const { req, body } = ctx as { req: NextRequest; body: z.infer<typeof CreateRiskSchema> };
    const { orgId, userId } = await getAdminOrgId(req);

    const risk = await createRisk({
      organizationId: orgId,
      asset:          body.asset,
      threat:         body.threat,
      vulnerability:  body.vulnerability,
      likelihood:     body.likelihood,
      impact:         body.impact,
      treatment:      body.treatment,
      treatmentDesc:  body.treatmentDesc,
      owner:          body.owner,
      dueDate:        body.dueDate ? new Date(body.dueDate) : undefined,
      createdBy:      userId,
    });

    return created(risk, `/api/admin/compliance/risks/${risk.id}`);
  }
);

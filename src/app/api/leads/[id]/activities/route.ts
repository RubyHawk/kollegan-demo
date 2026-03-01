/**
 * GET  /api/leads/:id/activities  — get activity timeline for a lead
 * POST /api/leads/:id/activities  — add an activity (note, call, email, etc.)
 *
 * Requires: JWT auth + staff role.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok, created } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { getLead, getLeadActivities, addLeadActivity } from '@modules/supporting/leads';

function requireStaff(roles: string[], orgId: string | null) {
  if (!orgId) throw Errors.forbidden('No organization context');
  if (!roles.some((r) => ['super_admin','admin','user'].includes(r)))
    throw Errors.forbidden('Leads access requires staff role');
}

function extractId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.indexOf('leads') + 1] ?? '';
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export const GET = createHandler(
  { auth: 'jwt', tag: 'Leads:Activities:List', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id  = extractId(req);
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);
    requireStaff(payload.roles, payload.orgId ?? null);

    const lead = await getLead(id, payload.orgId!);
    if (!lead) throw Errors.notFound('Lead not found');

    const activities = await getLeadActivities(id, payload.orgId!);
    return ok({ activities });
  },
);

// ─── POST ─────────────────────────────────────────────────────────────────────

const BodySchema = z.object({
  type:    z.enum(['note','call','email','stage_change','ai_interaction']),
  content: z.string().min(1).max(5000),
});

export const POST = createHandler(
  { auth: 'jwt', tag: 'Leads:Activities:Add', body: BodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as unknown as { body: z.infer<typeof BodySchema>; req: NextRequest };
    const id  = extractId(req);

    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);
    requireStaff(payload.roles, payload.orgId ?? null);

    const activity = await addLeadActivity(
      id,
      payload.orgId!,
      body.type,
      body.content,
      payload.sub,
    );

    return created({ activity });
  },
);

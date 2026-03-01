/**
 * GET    /api/leads/:id  — get lead by ID
 * PATCH  /api/leads/:id  — update lead fields (including status change)
 * DELETE /api/leads/:id  — soft-delete lead
 *
 * Requires: JWT auth + staff role.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { getLead, updateLead, deleteLead } from '@modules/supporting/leads';

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
  { auth: 'jwt', tag: 'Leads:Get', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id  = extractId(req);
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);
    requireStaff(payload.roles, payload.orgId ?? null);

    const lead = await getLead(id, payload.orgId!);
    if (!lead) throw Errors.notFound('Lead not found');
    return ok({ lead });
  },
);

// ─── PATCH ────────────────────────────────────────────────────────────────────

const UpdateBodySchema = z.object({
  name:           z.string().min(1).max(200).optional(),
  email:          z.string().email().optional(),
  phone:          z.string().max(30).optional(),
  company:        z.string().max(200).optional(),
  status:         z.enum(['new','contacted','qualified','proposal','won','lost']).optional(),
  score:          z.number().int().min(0).max(100).optional(),
  assignedTo:     z.string().uuid().optional(),
  notes:          z.string().max(2000).optional(),
  estimatedValue: z.number().min(0).optional(),
});

export const PATCH = createHandler(
  { auth: 'jwt', tag: 'Leads:Update', body: UpdateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as unknown as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id  = extractId(req);
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);
    requireStaff(payload.roles, payload.orgId ?? null);

    const lead = await updateLead(id, payload.orgId!, body, payload.sub);
    if (!lead) throw Errors.notFound('Lead not found');
    return ok({ lead });
  },
);

// ─── DELETE ───────────────────────────────────────────────────────────────────

export const DELETE = createHandler(
  { auth: 'jwt', tag: 'Leads:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id  = extractId(req);
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);
    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isAdmin = payload.roles.some((r) => ['super_admin','admin'].includes(r));
    if (!isAdmin) throw Errors.forbidden('Deleting leads requires admin role');

    const deleted = await deleteLead(id, payload.orgId);
    if (!deleted) throw Errors.notFound('Lead not found');
    return ok({ deleted: true });
  },
);

/**
 * GET  /api/leads  — list leads (filterable by status, assignedTo, source, search)
 * POST /api/leads  — create a new lead
 *
 * Requires: JWT auth + admin or user role.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok, created } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { createLead, listLeads } from '@modules/supporting/leads';

// ─── GET ──────────────────────────────────────────────────────────────────────

const GetQuerySchema = z.object({
  status:     z.enum(['new','contacted','qualified','proposal','won','lost']).optional(),
  assignedTo: z.string().optional(),
  source:     z.enum(['voice_call','web_form','manual','referral','n8n_webhook']).optional(),
  search:     z.string().max(100).optional(),
  limit:      z.coerce.number().int().min(1).max(100).default(50),
  offset:     z.coerce.number().int().min(0).default(0),
});

export const GET = createHandler(
  { auth: 'jwt', tag: 'Leads:List', query: GetQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof GetQuerySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isStaff = payload.roles.some((r) => ['super_admin','admin','user'].includes(r));
    if (!isStaff) throw Errors.forbidden('Leads access requires staff role');

    const { leads, total } = await listLeads(payload.orgId, {
      status:     query.status,
      assignedTo: query.assignedTo,
      source:     query.source,
      search:     query.search,
      limit:      query.limit,
      offset:     query.offset,
    });

    return ok({ leads, total, limit: query.limit, offset: query.offset });
  },
);

// ─── POST ─────────────────────────────────────────────────────────────────────

const CreateBodySchema = z.object({
  name:           z.string().min(1).max(200),
  email:          z.string().email().optional(),
  phone:          z.string().max(30).optional(),
  company:        z.string().max(200).optional(),
  status:         z.enum(['new','contacted','qualified','proposal','won','lost']).default('new'),
  source:         z.enum(['voice_call','web_form','manual','referral','n8n_webhook']).default('manual'),
  score:          z.number().int().min(0).max(100).optional(),
  assignedTo:     z.string().uuid().optional(),
  notes:          z.string().max(2000).optional(),
  estimatedValue: z.number().min(0).optional(),
});

export const POST = createHandler(
  { auth: 'jwt', tag: 'Leads:Create', body: CreateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isStaff = payload.roles.some((r) => ['super_admin','admin','user'].includes(r));
    if (!isStaff) throw Errors.forbidden('Leads access requires staff role');

    const lead = await createLead({ ...body, organizationId: payload.orgId }, payload.sub);
    return created({ lead });
  },
);

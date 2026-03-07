/**
 * Leads API handlers — colocated with the leads module.
 *
 * All handlers use createHandler from @platform/api which provides:
 *   - JWT authentication
 *   - Rate limiting
 *   - Zod validation
 *   - RFC 9110 / 9457 compliant error responses
 *
 * app/api/ routes are thin re-export wrappers that point here.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok, created } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import {
  createLead,
  listLeads,
  getLead,
  updateLead,
  deleteLead,
  addLeadActivity,
  getLeadActivities,
  convertLead,
} from '../../application/leads.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function requireStaff(roles: string[], orgId: string | null) {
  if (!orgId) throw Errors.forbidden('No organization context');
  if (!roles.some((r) => ['super_admin', 'admin', 'user'].includes(r)))
    throw Errors.forbidden('Leads access requires staff role');
}

function extractId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.indexOf('leads') + 1] ?? '';
}

async function extractAuth(req: NextRequest) {
  const token =
    req.headers.get('authorization')?.slice(7) ??
    req.cookies.get('token')?.value ??
    '';
  return verifyToken(token);
}

// ── List Leads ───────────────────────────────────────────────────────────────

const GetQuerySchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']).optional(),
  assignedTo: z.string().optional(),
  source: z.enum(['voice_call', 'web_form', 'manual', 'referral', 'n8n_webhook']).optional(),
  search: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const handleListLeads = createHandler(
  { auth: 'jwt', tag: 'Leads:List', query: GetQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof GetQuerySchema>; req: NextRequest };
    const payload = await extractAuth(req);
    requireStaff(payload.roles, payload.orgId ?? null);

    const { leads, total } = await listLeads(payload.orgId!, {
      status: query.status,
      assignedTo: query.assignedTo,
      source: query.source,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
    });

    return ok({ leads, total, limit: query.limit, offset: query.offset });
  },
);

// ── Create Lead ──────────────────────────────────────────────────────────────

const CreateBodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']).default('new'),
  source: z.enum(['voice_call', 'web_form', 'manual', 'referral', 'n8n_webhook']).default('manual'),
  score: z.number().int().min(0).max(100).optional(),
  assignedTo: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
  estimatedValue: z.number().min(0).optional(),
});

export const handleCreateLead = createHandler(
  { auth: 'jwt', tag: 'Leads:Create', body: CreateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await extractAuth(req);
    requireStaff(payload.roles, payload.orgId ?? null);

    const lead = await createLead({ ...body, organizationId: payload.orgId! }, payload.sub);
    return created({ lead });
  },
);

// ── Get Lead ─────────────────────────────────────────────────────────────────

export const handleGetLead = createHandler(
  { auth: 'jwt', tag: 'Leads:Get', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id = extractId(req);
    const payload = await extractAuth(req);
    requireStaff(payload.roles, payload.orgId ?? null);

    const lead = await getLead(id, payload.orgId!);
    if (!lead) throw Errors.notFound('Lead not found');
    return ok({ lead });
  },
);

// ── Update Lead ──────────────────────────────────────────────────────────────

const UpdateBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']).optional(),
  score: z.number().int().min(0).max(100).optional(),
  assignedTo: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
  estimatedValue: z.number().min(0).optional(),
});

export const handleUpdateLead = createHandler(
  { auth: 'jwt', tag: 'Leads:Update', body: UpdateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as unknown as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id = extractId(req);
    const payload = await extractAuth(req);
    requireStaff(payload.roles, payload.orgId ?? null);

    const lead = await updateLead(id, payload.orgId!, body, payload.sub);
    if (!lead) throw Errors.notFound('Lead not found');
    return ok({ lead });
  },
);

// ── Delete Lead ──────────────────────────────────────────────────────────────

export const handleDeleteLead = createHandler(
  { auth: 'jwt', tag: 'Leads:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id = extractId(req);
    const payload = await extractAuth(req);

    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isAdmin = payload.roles.some((r) => ['super_admin', 'admin'].includes(r));
    if (!isAdmin) throw Errors.forbidden('Deleting leads requires admin role');

    const deleted = await deleteLead(id, payload.orgId);
    if (!deleted) throw Errors.notFound('Lead not found');
    return ok({ deleted: true });
  },
);

// ── List Activities ──────────────────────────────────────────────────────────

export const handleListActivities = createHandler(
  { auth: 'jwt', tag: 'Leads:Activities:List', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id = extractId(req);
    const payload = await extractAuth(req);
    requireStaff(payload.roles, payload.orgId ?? null);

    const lead = await getLead(id, payload.orgId!);
    if (!lead) throw Errors.notFound('Lead not found');

    const activities = await getLeadActivities(id, payload.orgId!);
    return ok({ activities });
  },
);

// ── Add Activity ─────────────────────────────────────────────────────────────

const ActivityBodySchema = z.object({
  type: z.enum(['note', 'call', 'email', 'stage_change', 'ai_interaction']),
  content: z.string().min(1).max(5000),
});

export const handleAddActivity = createHandler(
  { auth: 'jwt', tag: 'Leads:Activities:Add', body: ActivityBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as unknown as { body: z.infer<typeof ActivityBodySchema>; req: NextRequest };
    const id = extractId(req);
    const payload = await extractAuth(req);
    requireStaff(payload.roles, payload.orgId ?? null);

    const activity = await addLeadActivity(id, payload.orgId!, body.type, body.content, payload.sub);
    return created({ activity });
  },
);

// ── Convert Lead ─────────────────────────────────────────────────────────────

const ConvertBodySchema = z.object({
  customerId: z.string().min(1),
});

export const handleConvertLead = createHandler(
  { auth: 'jwt', tag: 'Leads:Convert', body: ConvertBodySchema, rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as unknown as { body: z.infer<typeof ConvertBodySchema>; req: NextRequest };
    const id = extractId(req);
    const payload = await extractAuth(req);

    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isAdmin = payload.roles.some((r) => ['super_admin', 'admin'].includes(r));
    if (!isAdmin) throw Errors.forbidden('Converting leads requires admin role');

    const lead = await convertLead(id, payload.orgId, body.customerId, payload.sub);
    if (!lead) throw Errors.notFound('Lead not found');

    return ok({ lead });
  },
);

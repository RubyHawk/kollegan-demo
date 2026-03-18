/**
 * Offer Template API handlers.
 *
 * app/api/templates/ route files are thin re-export wrappers pointing here.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok, created } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import {
  createTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
  deleteTemplate,
} from '../../application/templates.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractToken(req: NextRequest): string {
  // Try Authorization header first, then the 'at' access-token cookie (set at login),
  // then 'token' (used in some handlers for compatibility).
  return (
    req.headers.get('authorization')?.slice(7) ??
    req.cookies.get('at')?.value ??
    req.cookies.get('token')?.value ??
    ''
  );
}

function extractId(req: NextRequest): string {
  return req.nextUrl.pathname.split('/').at(-1) ?? '';
}

async function requireStaff(req: NextRequest) {
  const payload = await verifyToken(extractToken(req));
  if (!payload.orgId) throw Errors.forbidden('No organization context');
  return payload;
}

// ── List Templates ────────────────────────────────────────────────────────────

export const handleListTemplates = createHandler(
  { auth: 'jwt', tag: 'Templates:List', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await requireStaff(req);
    const templates = await listTemplates(payload.orgId!);
    return ok(templates);
  },
);

// ── Create Template ───────────────────────────────────────────────────────────

const CreateTemplateSchema = z.object({
  name:         z.string().min(1).max(200),
  content:      z.string().min(2), // TipTap JSON string — at least '{}'
  emailSubject: z.string().max(500).optional(),
  emailBody:    z.string().max(50_000).optional(),
});

export const handleCreateTemplate = createHandler(
  { auth: 'jwt', tag: 'Templates:Create', body: CreateTemplateSchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateTemplateSchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const template = await createTemplate(
      { organizationId: payload.orgId!, name: body.name, content: body.content, emailSubject: body.emailSubject, emailBody: body.emailBody },
      payload.sub,
    );
    return created(template, `/api/templates/${template.id}`);
  },
);

// ── Get Template ──────────────────────────────────────────────────────────────

export const handleGetTemplate = createHandler(
  { auth: 'jwt', tag: 'Templates:Get', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id      = extractId(req);
    const payload = await requireStaff(req);
    const template = await getTemplate(id, payload.orgId!);
    if (!template) throw Errors.notFound('Template not found');
    return ok(template);
  },
);

// ── Update Template ───────────────────────────────────────────────────────────

const UpdateTemplateSchema = z.object({
  name:         z.string().min(1).max(200).optional(),
  content:      z.string().min(2).optional(),
  emailSubject: z.string().max(500).optional(),
  emailBody:    z.string().max(50_000).optional(),
});

export const handleUpdateTemplate = createHandler(
  { auth: 'jwt', tag: 'Templates:Update', body: UpdateTemplateSchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateTemplateSchema>; req: NextRequest };
    const id      = extractId(req);
    const payload = await requireStaff(req);
    const updated = await updateTemplate(id, payload.orgId!, { name: body.name, content: body.content, emailSubject: body.emailSubject, emailBody: body.emailBody });
    if (!updated) throw Errors.notFound('Template not found');
    return ok(updated);
  },
);

// ── Delete Template ───────────────────────────────────────────────────────────

export const handleDeleteTemplate = createHandler(
  { auth: 'jwt', tag: 'Templates:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id      = extractId(req);
    const payload = await verifyToken(extractToken(req));
    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isAdmin = payload.roles.some((r) => ['super_admin', 'admin'].includes(r));
    if (!isAdmin) throw Errors.forbidden('Template deletion requires admin role');
    const deleted = await deleteTemplate(id, payload.orgId);
    if (!deleted) throw Errors.notFound('Template not found');
    return ok(null);
  },
);

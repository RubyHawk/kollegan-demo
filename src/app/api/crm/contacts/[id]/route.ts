/**
 * GET    /api/crm/contacts/[id]  — get single contact
 * PATCH  /api/crm/contacts/[id]  — update contact
 * DELETE /api/crm/contacts/[id]  — delete contact
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok, noContent } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import { prisma } from '@platform/database/prisma';

function extractId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.indexOf('contacts') + 1] ?? '';
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export const GET = createHandler(
  { auth: 'jwt', tag: 'Contacts:Get', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id  = extractId(req);
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const contact = await prisma.customer.findFirst({
      where: { id, organizationId: payload.orgId },
      include: {
        bookings:    { orderBy: { createdAt: 'desc' }, take: 10 },
        transcripts: { orderBy: { startedAt: 'desc' }, take: 5 },
      },
    });
    if (!contact) throw Errors.notFound('Contact not found');

    return ok({ contact });
  },
);

// ─── PATCH ────────────────────────────────────────────────────────────────────

const UpdateBodySchema = z.object({
  name:    z.string().min(1).max(200).optional(),
  phone:   z.string().max(30).optional().nullable(),
  email:   z.string().email().optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  notes:   z.string().max(2000).optional().nullable(),
});

export const PATCH = createHandler(
  { auth: 'jwt', tag: 'Contacts:Update', body: UpdateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as unknown as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id = extractId(req);
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const existing = await prisma.customer.findFirst({ where: { id, organizationId: payload.orgId } });
    if (!existing) throw Errors.notFound('Contact not found');

    const contact = await prisma.customer.update({
      where: { id },
      data: {
        name:    body.name    ?? undefined,
        phone:   body.phone   !== undefined ? body.phone   : undefined,
        email:   body.email   !== undefined ? body.email   : undefined,
        company: body.company !== undefined ? body.company : undefined,
        notes:   body.notes   !== undefined ? body.notes   : undefined,
      },
    });

    return ok({ contact });
  },
);

// ─── DELETE ───────────────────────────────────────────────────────────────────

export const DELETE = createHandler(
  { auth: 'jwt', tag: 'Contacts:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const req = (ctx as unknown as { req: NextRequest }).req;
    const id  = extractId(req);
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isAdmin = payload.roles.some((r) => ['super_admin', 'admin'].includes(r));
    if (!isAdmin) throw Errors.forbidden('Admin role required');

    const existing = await prisma.customer.findFirst({ where: { id, organizationId: payload.orgId } });
    if (!existing) throw Errors.notFound('Contact not found');

    await prisma.customer.delete({ where: { id } });

    return noContent();
  },
);

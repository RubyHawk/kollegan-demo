/**
 * GET  /api/crm/contacts  — list customers/contacts
 * POST /api/crm/contacts  — create a new customer contact
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok, created } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { prisma } from '@core/database/prisma';

// ─── GET ──────────────────────────────────────────────────────────────────────

const GetQuerySchema = z.object({
  search: z.string().max(100).optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const GET = createHandler(
  { auth: 'jwt', tag: 'Contacts:List', query: GetQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof GetQuerySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { organizationId: payload.orgId };
    if (query.search) {
      where.OR = [
        { name:    { contains: query.search, mode: 'insensitive' } },
        { email:   { contains: query.search, mode: 'insensitive' } },
        { phone:   { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { lastSeen: 'desc' },
        take:  query.limit,
        skip:  query.offset,
      }),
      prisma.customer.count({ where }),
    ]);

    return ok({ contacts, total, limit: query.limit, offset: query.offset });
  },
);

// ─── POST ─────────────────────────────────────────────────────────────────────

const CreateBodySchema = z.object({
  name:    z.string().min(1).max(200),
  phone:   z.string().max(30).optional(),
  email:   z.string().email().optional(),
  company: z.string().max(200).optional(),
  notes:   z.string().max(2000).optional(),
});

export const POST = createHandler(
  { auth: 'jwt', tag: 'Contacts:Create', body: CreateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('token')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isStaff = payload.roles.some((r) => ['super_admin', 'admin', 'user'].includes(r));
    if (!isStaff) throw Errors.forbidden('Staff role required');

    const contact = await prisma.customer.create({
      data: {
        organizationId: payload.orgId,
        name:    body.name,
        phone:   body.phone ?? null,
        email:   body.email ?? null,
        company: body.company ?? null,
        notes:   body.notes ?? null,
        callCount: 0,
      },
    });

    return created({ contact });
  },
);

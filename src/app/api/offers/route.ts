/**
 * GET  /api/offers  — list offers (filterable by status, search, leadId)
 * POST /api/offers  — create a new offer
 *
 * Requires: JWT auth + staff role (admin or user).
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok, created } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import { createOffer, listOffers } from '@modules/supporting/offers';

// ─── GET ──────────────────────────────────────────────────────────────────────

const GetQuerySchema = z.object({
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired']).optional(),
  search: z.string().max(100).optional(),
  leadId: z.string().optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const GET = createHandler(
  { auth: 'jwt', tag: 'Offers:List', query: GetQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof GetQuerySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isStaff = payload.roles.some((r) => ['super_admin', 'admin', 'user'].includes(r));
    if (!isStaff) throw Errors.forbidden('Offers access requires staff role');

    const { offers, total } = await listOffers(payload.orgId, {
      status: query.status,
      search: query.search,
      leadId: query.leadId,
      limit:  query.limit,
      offset: query.offset,
    });

    return ok({ offers, total, limit: query.limit, offset: query.offset });
  },
);

// ─── POST ─────────────────────────────────────────────────────────────────────

const LineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity:    z.number().positive(),
  unitPrice:   z.number().min(0),
  vatRate:     z.number().min(0).max(1).default(0.25),
  discount:    z.number().min(0).max(100).default(0),
  sortOrder:   z.number().int().default(0),
});

const CreateBodySchema = z.object({
  title:            z.string().min(1).max(300),
  recipientName:    z.string().min(1).max(200),
  recipientEmail:   z.string().email(),
  recipientCompany: z.string().max(200).optional(),
  notes:            z.string().max(5000).optional(),
  validUntil:       z.string().datetime(),
  leadId:           z.string().optional(),
  customerId:       z.string().optional(),
  lineItems:        z.array(LineItemSchema).min(1).max(100),
});

export const POST = createHandler(
  { auth: 'jwt', tag: 'Offers:Create', body: CreateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isStaff = payload.roles.some((r) => ['super_admin', 'admin', 'user'].includes(r));
    if (!isStaff) throw Errors.forbidden('Offers creation requires staff role');

    const offer = await createOffer(
      {
        organizationId:   payload.orgId,
        title:            body.title,
        recipientName:    body.recipientName,
        recipientEmail:   body.recipientEmail,
        recipientCompany: body.recipientCompany,
        notes:            body.notes,
        validUntil:       new Date(body.validUntil),
        leadId:           body.leadId,
        customerId:       body.customerId,
        lineItems:        body.lineItems,
      },
      payload.sub,
    );

    return created(`/api/offers/${offer.id}`, offer);
  },
);

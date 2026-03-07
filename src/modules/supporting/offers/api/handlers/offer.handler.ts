/**
 * Offer API handlers — colocated with the offers module.
 *
 * app/api/offers/ routes are thin re-export wrappers that point here.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok, created } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import {
  createOffer,
  getOffer,
  listOffers,
  updateOffer,
  sendOffer,
  acceptOffer,
  declineOffer,
  deleteOffer,
} from '../../application/offers.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

function extractId(req: NextRequest): string {
  return req.nextUrl.pathname.split('/').at(-1) ?? '';
}

async function requireStaff(req: NextRequest) {
  const payload = await verifyToken(extractToken(req));
  if (!payload.orgId) throw Errors.forbidden('No organization context');
  const isStaff = payload.roles.some((r) => ['super_admin', 'admin', 'user'].includes(r));
  if (!isStaff) throw Errors.forbidden('Offers access requires staff role');
  return payload;
}

// ── List Offers ──────────────────────────────────────────────────────────────

const ListQuerySchema = z.object({
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired']).optional(),
  search: z.string().max(100).optional(),
  leadId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const handleListOffers = createHandler(
  { auth: 'jwt', tag: 'Offers:List', query: ListQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof ListQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const { offers, total } = await listOffers(payload.orgId!, {
      status: query.status, search: query.search, leadId: query.leadId,
      limit: query.limit, offset: query.offset,
    });
    return ok({ offers, total, limit: query.limit, offset: query.offset });
  },
);

// ── Create Offer ─────────────────────────────────────────────────────────────

const LineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  vatRate: z.number().min(0).max(1).default(0.25),
  discount: z.number().min(0).max(100).default(0),
  sortOrder: z.number().int().default(0),
});

const CreateBodySchema = z.object({
  title: z.string().min(1).max(300),
  recipientName: z.string().min(1).max(200),
  recipientEmail: z.string().email(),
  recipientCompany: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  validUntil: z.string().datetime(),
  leadId: z.string().optional(),
  customerId: z.string().optional(),
  lineItems: z.array(LineItemSchema).min(1).max(100),
});

export const handleCreateOffer = createHandler(
  { auth: 'jwt', tag: 'Offers:Create', body: CreateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const offer = await createOffer({
      organizationId: payload.orgId!,
      title: body.title, recipientName: body.recipientName,
      recipientEmail: body.recipientEmail, recipientCompany: body.recipientCompany,
      notes: body.notes, validUntil: new Date(body.validUntil),
      leadId: body.leadId, customerId: body.customerId, lineItems: body.lineItems,
    }, payload.sub);
    return created(`/api/offers/${offer.id}`, offer);
  },
);

// ── Get Offer ────────────────────────────────────────────────────────────────

export const handleGetOffer = createHandler(
  { auth: 'jwt', tag: 'Offers:Get', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id = extractId(req);
    const payload = await verifyToken(extractToken(req));
    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const offer = await getOffer(id, payload.orgId);
    if (!offer) throw Errors.notFound('Offer not found');
    return ok(offer);
  },
);

// ── Update/Action Offer ──────────────────────────────────────────────────────

const PatchBodySchema = z.object({
  title: z.string().min(1).max(300).optional(),
  recipientName: z.string().min(1).max(200).optional(),
  recipientEmail: z.string().email().optional(),
  recipientCompany: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  validUntil: z.string().datetime().optional(),
  lineItems: z.array(LineItemSchema).min(1).max(100).optional(),
});

const PatchQuerySchema = z.object({
  action: z.enum(['send', 'accept', 'decline']).optional(),
});

export const handleUpdateOffer = createHandler(
  { auth: 'jwt', tag: 'Offers:Update', body: PatchBodySchema, query: PatchQuerySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, query, req } = ctx as {
      body: z.infer<typeof PatchBodySchema>;
      query: z.infer<typeof PatchQuerySchema>;
      req: NextRequest;
    };
    const id = extractId(req);
    const payload = await requireStaff(req);

    let updated;
    if (query.action === 'send') updated = await sendOffer(id, payload.orgId!);
    else if (query.action === 'accept') updated = await acceptOffer(id, payload.orgId!);
    else if (query.action === 'decline') updated = await declineOffer(id, payload.orgId!);
    else {
      updated = await updateOffer(id, payload.orgId!, {
        title: body.title, recipientName: body.recipientName,
        recipientEmail: body.recipientEmail, recipientCompany: body.recipientCompany,
        notes: body.notes, validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
        lineItems: body.lineItems,
      });
    }

    if (!updated) throw Errors.notFound('Offer not found');
    return ok(updated);
  },
);

// ── Delete Offer ─────────────────────────────────────────────────────────────

export const handleDeleteOffer = createHandler(
  { auth: 'jwt', tag: 'Offers:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id = extractId(req);
    const payload = await verifyToken(extractToken(req));
    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isAdmin = payload.roles.some((r) => ['super_admin', 'admin'].includes(r));
    if (!isAdmin) throw Errors.forbidden('Offer deletion requires admin role');
    const deleted = await deleteOffer(id, payload.orgId);
    if (!deleted) throw Errors.notFound('Offer not found');
    return ok(null);
  },
);

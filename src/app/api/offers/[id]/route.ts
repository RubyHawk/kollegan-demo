/**
 * GET    /api/offers/[id]  — get a single offer
 * PATCH  /api/offers/[id]  — update offer (fields + line items)
 * DELETE /api/offers/[id]  — soft-delete offer
 *
 * Special PATCH actions via ?action=:
 *   send    — mark as sent (sets sentAt)
 *   accept  — mark as accepted (sets acceptedAt, auto-wins linked lead)
 *   decline — mark as declined (sets declinedAt)
 *
 * Requires: JWT auth + staff role.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { verifyToken } from '@core/auth/jwt';
import {
  getOffer,
  updateOffer,
  sendOffer,
  acceptOffer,
  declineOffer,
  deleteOffer,
} from '@modules/supporting/offers';

// ─── GET ──────────────────────────────────────────────────────────────────────

export const GET = createHandler(
  { auth: 'jwt', tag: 'Offers:Get', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id = req.nextUrl.pathname.split('/').at(-1) ?? '';
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');

    const offer = await getOffer(id, payload.orgId);
    if (!offer) throw Errors.notFound('Offer not found');

    return ok(offer);
  },
);

// ─── PATCH ────────────────────────────────────────────────────────────────────

const LineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity:    z.number().positive(),
  unitPrice:   z.number().min(0),
  vatRate:     z.number().min(0).max(1).default(0.25),
  discount:    z.number().min(0).max(100).default(0),
  sortOrder:   z.number().int().default(0),
});

const PatchBodySchema = z.object({
  title:            z.string().min(1).max(300).optional(),
  recipientName:    z.string().min(1).max(200).optional(),
  recipientEmail:   z.string().email().optional(),
  recipientCompany: z.string().max(200).optional(),
  notes:            z.string().max(5000).optional(),
  validUntil:       z.string().datetime().optional(),
  lineItems:        z.array(LineItemSchema).min(1).max(100).optional(),
});

const PatchQuerySchema = z.object({
  action: z.enum(['send', 'accept', 'decline']).optional(),
});

export const PATCH = createHandler(
  { auth: 'jwt', tag: 'Offers:Update', body: PatchBodySchema, query: PatchQuerySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, query, req } = ctx as {
      body:  z.infer<typeof PatchBodySchema>;
      query: z.infer<typeof PatchQuerySchema>;
      req:   NextRequest;
    };
    const id = req.nextUrl.pathname.split('/').at(-1) ?? '';
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isStaff = payload.roles.some((r) => ['super_admin', 'admin', 'user'].includes(r));
    if (!isStaff) throw Errors.forbidden('Offers update requires staff role');

    let updated;

    if (query.action === 'send')    updated = await sendOffer(id, payload.orgId);
    else if (query.action === 'accept')  updated = await acceptOffer(id, payload.orgId);
    else if (query.action === 'decline') updated = await declineOffer(id, payload.orgId);
    else {
      updated = await updateOffer(id, payload.orgId, {
        title:            body.title,
        recipientName:    body.recipientName,
        recipientEmail:   body.recipientEmail,
        recipientCompany: body.recipientCompany,
        notes:            body.notes,
        validUntil:       body.validUntil ? new Date(body.validUntil) : undefined,
        lineItems:        body.lineItems,
      });
    }

    if (!updated) throw Errors.notFound('Offer not found');
    return ok(updated);
  },
);

// ─── DELETE ───────────────────────────────────────────────────────────────────

export const DELETE = createHandler(
  { auth: 'jwt', tag: 'Offers:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id = req.nextUrl.pathname.split('/').at(-1) ?? '';
    const token = req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
    const payload = await verifyToken(token);

    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isAdmin = payload.roles.some((r) => ['super_admin', 'admin'].includes(r));
    if (!isAdmin) throw Errors.forbidden('Offer deletion requires admin role');

    const deleted = await deleteOffer(id, payload.orgId);
    if (!deleted) throw Errors.notFound('Offer not found');

    return ok(null);
  },
);

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
import { constantTimeEqual } from '@platform/security/sanitize';
import { DEFAULT_OFFER_PRICE_DISPLAY_MODE } from '../../domain/pricing';
import { computeOfferValidUntil } from '../../domain/validity';
import {
  createOffer,
  getOffer,
  listOffers,
  countOffers,
  updateOffer,
  sendOffer,
  acceptOffer,
  declineOffer,
  deleteOffer,
  duplicateOffer,
  expireStaleOffers,
  bulkSendOffers,
  sendOfferReminder,
} from '../../application/offers.service';
import { resolveOfferBrandingForOffer } from '../../application/offer-branding-profile';
import { sanitizeGeneratedOfferDocument } from '../../application/document-generator';

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
  return payload;
}

// ── List Offers ──────────────────────────────────────────────────────────────

const ListQuerySchema = z.object({
  status:   z.enum(['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired']).optional(),
  search:   z.string().max(100).optional(),
  leadId:   z.string().optional(),
  limit:    z.coerce.number().int().min(1).max(200).default(50),
  offset:   z.coerce.number().int().min(0).default(0),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const handleListOffers = createHandler(
  { auth: 'jwt', tag: 'Offers:List', query: ListQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof ListQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    await expireStaleOffers(); // mark any newly-expired offers before returning the list
    const { offers, total } = await listOffers(payload.orgId!, {
      status: query.status, search: query.search, leadId: query.leadId,
      limit: query.limit, offset: query.offset,
      dateFrom: query.dateFrom, dateTo: query.dateTo,
    });
    return ok({ offers, total, limit: query.limit, offset: query.offset });
  },
);

// ── Count Offers (tab badge counts) ──────────────────────────────────────────

const CountQuerySchema = z.object({
  search: z.string().max(100).optional(),
});

export const handleCountOffers = createHandler(
  { auth: 'jwt', tag: 'Offers:Count', query: CountQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof CountQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const counts = await countOffers(payload.orgId!, query.search);
    return ok({ counts });
  },
);

// ── Create Offer ─────────────────────────────────────────────────────────────

const LineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  vatRate: z.number().min(0).max(1).default(0.25),
  discount: z.number().min(0).max(100).default(0),
  sortOrder: z.number().int().optional(),
});

const VALID_VALIDITY_DAYS = [7, 14, 30, 60, 90] as const;

const CreateBodySchema = z.object({
  title: z.string().min(1).max(300),
  priceDisplayMode: z.enum(['exclusive', 'inclusive']).default('inclusive'),
  recipientName: z.string().min(1).max(200),
  recipientEmail: z.string().email(),
  recipientCompany: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  validityDays: z.number().int().refine((v) => (VALID_VALIDITY_DAYS as readonly number[]).includes(v), {
    message: `validityDays must be one of: ${VALID_VALIDITY_DAYS.join(', ')}`,
  }),
  leadId: z.string().optional(),
  customerId: z.string().optional(),
  companyId: z.string().optional(),
  templateId: z.string().optional(),
  emailSubject: z.string().max(500).regex(/^[^\r\n]*$/, 'Subject must not contain newlines').optional(),
  emailBody: z.string().max(50_000).optional(),
  emailHeaderConfig: z.string().max(5_000).optional(),
  lineItems: z.array(LineItemSchema).min(1).max(100),
});

export const handleCreateOffer = createHandler(
  { auth: 'jwt', tag: 'Offers:Create', body: CreateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    // Placeholder validUntil for the draft; recalculated from sentAt at send time
    const placeholderValidUntil = computeOfferValidUntil(new Date(), body.validityDays);
    const offer = await createOffer({
      organizationId: payload.orgId!,
      createdBy:      payload.sub,
      priceDisplayMode: DEFAULT_OFFER_PRICE_DISPLAY_MODE,
      title: body.title, recipientName: body.recipientName,
      recipientEmail: body.recipientEmail, recipientCompany: body.recipientCompany,
      notes: body.notes, validUntil: placeholderValidUntil, validityDays: body.validityDays,
      leadId: body.leadId, customerId: body.customerId, companyId: body.companyId,
      templateId: body.templateId,
      emailSubject: body.emailSubject, emailBody: body.emailBody, emailHeaderConfig: body.emailHeaderConfig,
      lineItems: body.lineItems,
    }, payload.sub);
    return created(offer, `/api/offers/${offer.id}`);
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
    if (offer.generatedDocument) {
      const branding = await resolveOfferBrandingForOffer(offer);
      offer.generatedDocument = sanitizeGeneratedOfferDocument(offer.generatedDocument, offer, branding);
    }
    return ok(offer);
  },
);

// ── Update/Action Offer ──────────────────────────────────────────────────────

const PatchBodySchema = z.object({
  title: z.string().min(1).max(300).optional(),
  priceDisplayMode: z.enum(['exclusive', 'inclusive']).optional(),
  recipientName: z.string().min(1).max(200).optional(),
  recipientEmail: z.string().email().optional(),
  recipientCompany: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  validityDays: z.number().int().refine((v) => (VALID_VALIDITY_DAYS as readonly number[]).includes(v), {
    message: `validityDays must be one of: ${VALID_VALIDITY_DAYS.join(', ')}`,
  }).optional(),
  companyId: z.string().optional(),
  emailSubject: z.string().max(500).regex(/^[^\r\n]*$/, 'Subject must not contain newlines').optional(),
  emailBody: z.string().max(50_000).optional(),
  emailHeaderConfig: z.string().max(5_000).optional(),
  lineItems: z.array(LineItemSchema).min(1).max(100).optional(),
});

const PatchQuerySchema = z.object({
  action: z.enum(['send', 'accept', 'decline', 'duplicate', 'remind']).optional(),
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

    if (query.action === 'duplicate') {
      const dup = await duplicateOffer(id, payload.orgId!, payload.sub);
      if (!dup) throw Errors.notFound('Offer not found');
      return created(dup, `/api/offers/${dup.id}`);
    }

    let updated;
    if (query.action === 'send') updated = await sendOffer(id, payload.orgId!);
    else if (query.action === 'accept') updated = await acceptOffer(id, payload.orgId!);
    else if (query.action === 'decline') updated = await declineOffer(id, payload.orgId!);
    else if (query.action === 'remind') updated = await sendOfferReminder(id, payload.orgId!);
    else {
      // If validityDays changed, recompute the placeholder validUntil for the draft
      const newValidUntil = body.validityDays !== undefined
        ? computeOfferValidUntil(new Date(), body.validityDays)
        : undefined;
      updated = await updateOffer(id, payload.orgId!, {
        title: body.title, priceDisplayMode: DEFAULT_OFFER_PRICE_DISPLAY_MODE, recipientName: body.recipientName,
        recipientEmail: body.recipientEmail, recipientCompany: body.recipientCompany,
        notes: body.notes, validUntil: newValidUntil, validityDays: body.validityDays,
        companyId: body.companyId,
        emailSubject: body.emailSubject, emailBody: body.emailBody, emailHeaderConfig: body.emailHeaderConfig,
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
    const payload = await requireStaff(req);
    const deleted = await deleteOffer(id, payload.orgId!);
    if (!deleted) throw Errors.notFound('Offer not found');
    return ok(null);
  },
);

// ── Bulk Send Offers ─────────────────────────────────────────────────────────

const BulkSendSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
});

export const handleBulkSendOffers = createHandler(
  { auth: 'jwt', tag: 'Offers:BulkSend', body: BulkSendSchema, rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof BulkSendSchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const result = await bulkSendOffers(body.ids, payload.orgId!);
    return ok(result);
  },
);

// ── Expire Offers (cron) ─────────────────────────────────────────────────────

export const handleExpireOffers = createHandler(
  { auth: 'none', tag: 'Offers:ExpireCron', rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const secret = req.headers.get('x-cron-secret');
    if (!process.env.CRON_SECRET || !secret || !constantTimeEqual(secret, process.env.CRON_SECRET)) {
      throw Errors.forbidden('Invalid cron secret');
    }
    const expired = await expireStaleOffers();
    return ok({ expired });
  },
);

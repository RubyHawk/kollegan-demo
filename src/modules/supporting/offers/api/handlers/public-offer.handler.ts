/**
 * Public Offer API handlers — no authentication required.
 *
 * These endpoints are used by the recipient's signing page:
 *   GET  /api/offers/public/[token]         — view offer (auto-marks as viewed)
 *   POST /api/offers/public/[token]/sign    — submit e-signature
 *   POST /api/offers/public/[token]/decline — decline the offer
 *
 * Security: publicToken is a UUID (2^122 entropy). Token expiration is
 * enforced server-side (publicTokenExpiresAt). 410 Gone is returned for
 * expired tokens.
 *
 * All events are written to the audit log with IP + user agent.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import {
  viewOffer,
  signOffer,
  declineOfferByToken,
} from '../../application/offers.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractToken(req: NextRequest): string {
  // URL pattern: /api/offers/public/[token] or /api/offers/public/[token]/sign
  const parts = req.nextUrl.pathname.split('/');
  // Find 'public' and take the segment after it
  const publicIdx = parts.indexOf('public');
  return publicIdx !== -1 ? (parts[publicIdx + 1] ?? '') : '';
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') ?? 'unknown';
}

// ── Get Public Offer ──────────────────────────────────────────────────────────

// Fields safe to expose to unauthenticated recipients (omit internal fields)
const PUBLIC_OFFER_FIELDS = [
  'id', 'title', 'status', 'recipientName', 'recipientEmail', 'recipientCompany',
  'totalExVat', 'totalIncVat', 'validUntil', 'notes', 'generatedDocument',
  'publicToken', 'publicTokenExpiresAt', 'lineItems', 'sentAt', 'acceptedAt', 'declinedAt', 'signerName',
] as const;

type PublicOffer = Record<(typeof PUBLIC_OFFER_FIELDS)[number], unknown>;

function toPublicOffer(offer: Record<string, unknown>): PublicOffer {
  const result = {} as PublicOffer;
  for (const field of PUBLIC_OFFER_FIELDS) {
    (result as Record<string, unknown>)[field] = offer[field];
  }
  return result;
}

export const handleGetPublicOffer = createHandler(
  { auth: 'none', tag: 'PublicOffer:Get', rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const token   = extractToken(req);
    if (!token) throw Errors.notFound('Offer not found');

    const ip        = getClientIp(req);
    const userAgent = getUserAgent(req);

    const offer = await viewOffer(token, ip, userAgent);

    if (!offer) {
      // Could be not found OR expired — check original to distinguish
      throw Errors.notFound('Offer not found or link has expired');
    }

    // Check expiration (belt-and-suspenders; viewOffer already returns null for expired)
    if (offer.publicTokenExpiresAt && new Date(offer.publicTokenExpiresAt) < new Date()) {
      throw Errors.notFound('Offer link has expired');
    }

    return ok(toPublicOffer(offer as unknown as Record<string, unknown>));
  },
);

// ── Sign Offer ────────────────────────────────────────────────────────────────

// Validate signature data URL: must be a base64 PNG/JPEG, max ~500KB
const MAX_SIGNATURE_BYTES = 500 * 1024;

const SignBodySchema = z.object({
  signatureImage: z.string()
    .min(10)
    .max(MAX_SIGNATURE_BYTES * 1.4) // base64 overhead ~1.37x
    .refine((v) => v.startsWith('data:image/'), 'signatureImage must be a data URL'),
  signerName: z.string().min(1).max(200).optional(),
});

export const handleSignPublicOffer = createHandler(
  { auth: 'none', tag: 'PublicOffer:Sign', body: SignBodySchema, rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof SignBodySchema>; req: NextRequest };
    const token         = extractToken(req);
    if (!token) throw Errors.notFound('Offer not found');

    const ip        = getClientIp(req);
    const userAgent = getUserAgent(req);

    const offer = await signOffer(token, body.signatureImage, ip, userAgent, body.signerName);

    if (!offer) {
      throw Errors.badRequest('Offer cannot be signed — it may not exist, have expired, or already been processed');
    }

    return ok({ status: offer.status, acceptedAt: offer.acceptedAt });
  },
);

// ── Decline Offer ─────────────────────────────────────────────────────────────

const DeclineBodySchema = z.object({
  comment: z.string().max(1000).optional(),
});

export const handleDeclinePublicOffer = createHandler(
  { auth: 'none', tag: 'PublicOffer:Decline', body: DeclineBodySchema, rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof DeclineBodySchema>; req: NextRequest };
    const token         = extractToken(req);
    if (!token) throw Errors.notFound('Offer not found');

    const ip        = getClientIp(req);
    const userAgent = getUserAgent(req);

    const offer = await declineOfferByToken(token, body.comment, ip, userAgent);

    if (!offer) {
      throw Errors.badRequest('Offer cannot be declined — it may not exist, have expired, or already been processed');
    }

    return ok({ status: offer.status, declinedAt: offer.declinedAt });
  },
);

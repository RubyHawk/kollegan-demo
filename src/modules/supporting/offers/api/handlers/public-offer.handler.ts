/**
 * Public offer API handlers with no authentication required.
 *
 * Endpoints:
 *   GET  /api/offers/public/[token]         - view offer (auto-marks as viewed)
 *   POST /api/offers/public/[token]/sign    - submit e-signature
 *   POST /api/offers/public/[token]/decline - decline the offer
 *
 * Security: publicToken is a UUID (2^122 entropy). Token expiration is
 * enforced server-side via publicTokenExpiresAt.
 *
 * All events are written to the audit log with IP and user agent.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import {
  viewOffer,
  markOfferViewed,
  signOffer,
  declineOfferByToken,
} from '../../application/offers.service';
import { resolveOfferBrandingForOffer } from '../../application/offer-branding-profile';
import { sanitizePublicOfferDocument } from '../../application/public-offer-document';
import { resolvePublicOfferRendererVariant } from '../../application/public-offer-renderer.service';

function extractToken(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
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

const PUBLIC_OFFER_FIELDS = [
  'id', 'title', 'status', 'recipientName', 'recipientEmail', 'recipientCompany',
  'priceDisplayMode', 'totalExVat', 'totalIncVat', 'validUntil', 'notes', 'generatedDocument',
  'publicToken', 'publicTokenExpiresAt', 'lineItems', 'sentAt', 'acceptedAt', 'declinedAt', 'signerName',
  'signatureImage',
] as const;

type PublicOffer = Record<(typeof PUBLIC_OFFER_FIELDS)[number], unknown> & {
  rendererVariant?: 'legacy' | 'next';
};

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
    const token = extractToken(req);
    if (!token) throw Errors.notFound('Offer not found');

    const offer = await viewOffer(token);
    if (!offer) {
      throw Errors.notFound('Offer not found or link has expired');
    }

    if (offer.publicTokenExpiresAt && new Date(offer.publicTokenExpiresAt) < new Date()) {
      throw Errors.notFound('Offer link has expired');
    }

    const branding = await resolveOfferBrandingForOffer(offer);
    const publicOffer = toPublicOffer(offer as unknown as Record<string, unknown>);
    publicOffer.rendererVariant = await resolvePublicOfferRendererVariant(offer as unknown as Record<string, unknown>);
    if (offer.generatedDocument) {
      publicOffer.generatedDocument = sanitizePublicOfferDocument(offer.generatedDocument, offer, branding);
    }

    return ok(publicOffer);
  },
);

export const handleMarkPublicOfferViewed = createHandler(
  { auth: 'none', tag: 'PublicOffer:View', rateLimit: { max: 20, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const token = extractToken(req);
    if (!token) throw Errors.notFound('Offer not found');

    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);
    const offer = await markOfferViewed(token, ip, userAgent);

    if (!offer) {
      throw Errors.notFound('Offer not found or link has expired');
    }

    return ok({ status: offer.status, viewedAt: offer.viewedAt ?? null });
  },
);

const MAX_SIGNATURE_BYTES = 500 * 1024;

const SignBodySchema = z.object({
  signatureImage: z.string()
    .min(10)
    .max(MAX_SIGNATURE_BYTES * 1.4)
    .refine(
      (v) => v.startsWith('data:image/png;base64,') || v.startsWith('data:image/jpeg;base64,'),
      'Only PNG and JPEG signatures are accepted',
    ),
  signerName: z.string().min(1).max(200).optional(),
});

export const handleSignPublicOffer = createHandler(
  { auth: 'none', tag: 'PublicOffer:Sign', body: SignBodySchema, rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof SignBodySchema>; req: NextRequest };
    const token = extractToken(req);
    if (!token) throw Errors.notFound('Offer not found');

    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);
    const offer = await signOffer(token, body.signatureImage, ip, userAgent, body.signerName);

    if (!offer) {
      throw Errors.badRequest('Offer cannot be signed - it may not exist, have expired, or already been processed');
    }

    return ok({ status: offer.status, acceptedAt: offer.acceptedAt });
  },
);

const DeclineBodySchema = z.object({
  comment: z.string().max(1000).optional(),
});

export const handleDeclinePublicOffer = createHandler(
  { auth: 'none', tag: 'PublicOffer:Decline', body: DeclineBodySchema, rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof DeclineBodySchema>; req: NextRequest };
    const token = extractToken(req);
    if (!token) throw Errors.notFound('Offer not found');

    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);
    const offer = await declineOfferByToken(token, body.comment, ip, userAgent);

    if (!offer) {
      throw Errors.badRequest('Offer cannot be declined - it may not exist, have expired, or already been processed');
    }

    return ok({ status: offer.status, declinedAt: offer.declinedAt });
  },
);

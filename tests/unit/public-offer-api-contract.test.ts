import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@platform/cache/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 59, resetAt: Date.now() + 60_000 }),
}));

vi.mock('@platform/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@modules/supporting/offers/application/offers.service', () => ({
  viewOffer: vi.fn(),
  markOfferViewed: vi.fn(),
  signOffer: vi.fn(),
  declineOfferByToken: vi.fn(),
}));

vi.mock('@modules/supporting/offers/application/offer-branding-profile', () => ({
  resolveOfferBrandingForOffer: vi.fn().mockResolvedValue({ merged: {} }),
}));

vi.mock('@modules/supporting/offers/application/public-offer-document', () => ({
  sanitizePublicOfferDocument: vi.fn((document) => ({ ...document, sanitized: true })),
}));

vi.mock('@modules/supporting/offers/application/public-offer-renderer.service', () => ({
  resolvePublicOfferRendererVariant: vi.fn().mockResolvedValue('legacy'),
}));

import {
  declineOfferByToken,
  markOfferViewed,
  signOffer,
  viewOffer,
} from '@modules/supporting/offers/application/offers.service';
import { sanitizePublicOfferDocument } from '@modules/supporting/offers/application/public-offer-document';
import { resolvePublicOfferRendererVariant } from '@modules/supporting/offers/application/public-offer-renderer.service';
import {
  handleDeclinePublicOffer,
  handleGetPublicOffer,
  handleMarkPublicOfferViewed,
  handleSignPublicOffer,
} from '@modules/supporting/offers/api/handlers/public-offer.handler';

function request(path: string, init: RequestInit = {}): NextRequest {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  return new NextRequest(`http://localhost${path}`, {
    method: init.method,
    headers,
    body: init.body,
  });
}

async function json(res: Response) {
  return res.json() as Promise<Record<string, unknown>>;
}

function futureIsoDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 5);
  return date.toISOString();
}

function offerFixture(overrides: Record<string, unknown> = {}) {
  const future = futureIsoDate();
  return {
    id: 'offer_1',
    organizationId: 'org_1',
    title: 'Solfilm montering',
    status: 'sent',
    recipientName: 'Anna Andersson',
    recipientEmail: 'anna@example.com',
    recipientCompany: 'Anna AB',
    priceDisplayMode: 'exclusive',
    totalExVat: 10000,
    totalIncVat: 12500,
    validUntil: future,
    notes: 'Publik notering',
    generatedDocument: { blocks: [{ type: 'paragraph', text: 'Hej' }] },
    publicToken: 'public-token',
    publicTokenExpiresAt: future,
    lineItems: [{ description: 'Film', quantity: 10, unitPrice: 1000 }],
    sentAt: '2026-04-19T00:00:00.000Z',
    acceptedAt: null,
    declinedAt: null,
    signerName: null,
    signatureImage: null,
    internalNotes: 'Ska aldrig exponeras',
    createdBy: 'user_1',
    ...overrides,
  };
}

describe('public offer API contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns only the recipient-safe public offer fields', async () => {
    vi.mocked(viewOffer).mockResolvedValue(offerFixture() as never);

    const res = await handleGetPublicOffer(request('/api/offers/public/public-token', { method: 'GET' }));
    const body = await json(res);
    const data = body.data as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(data).toMatchObject({
      id: 'offer_1',
      title: 'Solfilm montering',
      status: 'sent',
      recipientEmail: 'anna@example.com',
      generatedDocument: { sanitized: true },
      rendererVariant: 'legacy',
    });
    expect(data).not.toHaveProperty('internalNotes');
    expect(data).not.toHaveProperty('organizationId');
    expect(data).not.toHaveProperty('createdBy');
    expect(sanitizePublicOfferDocument).toHaveBeenCalledOnce();
    expect(resolvePublicOfferRendererVariant).toHaveBeenCalledWith(expect.objectContaining({
      id: 'offer_1',
      organizationId: 'org_1',
    }));
  });

  it('returns next renderer variant when the public offer flag is enabled', async () => {
    vi.mocked(viewOffer).mockResolvedValue(offerFixture() as never);
    vi.mocked(resolvePublicOfferRendererVariant).mockResolvedValue('next');

    const res = await handleGetPublicOffer(request('/api/offers/public/public-token', { method: 'GET' }));
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({ rendererVariant: 'next' });
  });

  it('fails open to the legacy renderer when feature flag lookup fails', async () => {
    vi.mocked(viewOffer).mockResolvedValue(offerFixture() as never);
    vi.mocked(resolvePublicOfferRendererVariant).mockResolvedValue('legacy');

    const res = await handleGetPublicOffer(request('/api/offers/public/public-token', { method: 'GET' }));
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({
      id: 'offer_1',
      rendererVariant: 'legacy',
    });
  });

  it('marks a public offer as viewed with client metadata', async () => {
    vi.mocked(markOfferViewed).mockResolvedValue({
      status: 'viewed',
      viewedAt: '2026-04-19T12:00:00.000Z',
    } as never);

    const res = await handleMarkPublicOfferViewed(request('/api/offers/public/public-token/view', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '203.0.113.10, 10.0.0.1',
        'user-agent': 'Vitest browser',
      },
      body: '{}',
    }));
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ status: 'viewed', viewedAt: '2026-04-19T12:00:00.000Z' });
    expect(markOfferViewed).toHaveBeenCalledWith('public-token', '203.0.113.10', 'Vitest browser');
  });

  it('signs with PNG/JPEG signatures and returns the stable accepted contract', async () => {
    vi.mocked(signOffer).mockResolvedValue({
      status: 'accepted',
      acceptedAt: '2026-04-19T12:30:00.000Z',
    } as never);

    const res = await handleSignPublicOffer(request('/api/offers/public/public-token/sign', {
      method: 'POST',
      headers: {
        'x-real-ip': '203.0.113.11',
        'user-agent': 'Vitest signer',
      },
      body: JSON.stringify({
        signatureImage: `data:image/png;base64,${'a'.repeat(40)}`,
        signerName: 'Anna Andersson',
      }),
    }));
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ status: 'accepted', acceptedAt: '2026-04-19T12:30:00.000Z' });
    expect(signOffer).toHaveBeenCalledWith(
      'public-token',
      expect.stringMatching(/^data:image\/png;base64,/),
      '203.0.113.11',
      'Vitest signer',
      'Anna Andersson',
    );
  });

  it('rejects invalid signature payloads before calling the service', async () => {
    const res = await handleSignPublicOffer(request('/api/offers/public/public-token/sign', {
      method: 'POST',
      body: JSON.stringify({
        signatureImage: 'data:text/plain;base64,abc',
        signerName: 'Anna Andersson',
      }),
    }));
    const body = await json(res);

    expect(res.status).toBe(400);
    expect(body).toMatchObject({ status: 400, title: 'Validation Error' });
    expect(signOffer).not.toHaveBeenCalled();
  });

  it('declines and returns the stable declined contract', async () => {
    vi.mocked(declineOfferByToken).mockResolvedValue({
      status: 'declined',
      declinedAt: '2026-04-19T13:00:00.000Z',
    } as never);

    const res = await handleDeclinePublicOffer(request('/api/offers/public/public-token/decline', {
      method: 'POST',
      headers: {
        'x-real-ip': '203.0.113.12',
        'user-agent': 'Vitest decliner',
      },
      body: JSON.stringify({ comment: 'Inte just nu' }),
    }));
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.data).toEqual({ status: 'declined', declinedAt: '2026-04-19T13:00:00.000Z' });
    expect(declineOfferByToken).toHaveBeenCalledWith(
      'public-token',
      'Inte just nu',
      '203.0.113.12',
      'Vitest decliner',
    );
  });
});

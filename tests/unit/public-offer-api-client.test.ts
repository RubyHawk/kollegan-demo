import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  PublicOfferApiError,
  downloadPublicOfferPdfBlob,
  fetchPublicOffer,
  signPublicOffer,
} from '../../src/app/offerter/publik/[token]/_api/public-offer.api';

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('public offer browser API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads a public offer from the legacy compatibility API path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      data: {
        id: 'offer_1',
        title: 'Solfilm',
        status: 'sent',
        priceDisplayMode: 'exclusive',
        recipientName: 'Anna',
        recipientEmail: 'anna@example.com',
        totalExVat: 1000,
        totalIncVat: 1250,
        lineItems: [],
        validUntil: '2026-05-01T00:00:00.000Z',
        publicToken: 'token',
        rendererVariant: 'legacy',
      },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPublicOffer('token')).resolves.toMatchObject({
      id: 'offer_1',
      rendererVariant: 'legacy',
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/offers/public/token');
  });

  it('turns missing or expired offer links into an expired-state error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, { status: 410 })));

    const request = fetchPublicOffer('expired-token');
    await expect(request).rejects.toBeInstanceOf(PublicOfferApiError);
    await expect(request).rejects.toMatchObject({
      status: 410,
      message: 'expired',
    });
  });

  it('keeps short actionable sign errors from the API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(
      { detail: 'Länken har gått ut.' },
      { status: 410 },
    )));

    await expect(signPublicOffer('token', {
      signatureImage: 'data:image/png;base64,x',
      signerName: 'Anna',
    })).rejects.toThrow('Länken har gått ut.');
  });

  it('downloads the offer PDF as a blob', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    const fetchMock = vi.fn().mockResolvedValue(new Response(blob, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(downloadPublicOfferPdfBlob('token')).resolves.toBeInstanceOf(Blob);
    expect(fetchMock).toHaveBeenCalledWith('/api/offers/public/token/pdf');
  });
});

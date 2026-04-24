import { NextRequest } from 'next/server';
import { vi } from 'vitest';

vi.mock('@platform/auth/jwt', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@modules/supporting/offers/application/offers.service', () => ({
  getOffer: vi.fn(),
}));

vi.mock('@modules/supporting/offers/application/offer-branding-profile', () => ({
  resolveOfferBrandingForOffer: vi.fn(),
}));

vi.mock('@modules/supporting/offers/application/document-generator', () => ({
  sanitizeGeneratedOfferDocument: vi.fn((html: string) => html),
}));

import { verifyToken } from '@platform/auth/jwt';
import { getOffer } from '@modules/supporting/offers/application/offers.service';
import { resolveOfferBrandingForOffer } from '@modules/supporting/offers/application/offer-branding-profile';
import { sanitizeGeneratedOfferDocument } from '@modules/supporting/offers/application/document-generator';
import { handleGetOfferPdf } from '@modules/supporting/offers/api/handlers/offer-pdf.handler';

describe('offer PDF handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('transliterates Swedish characters in the PDF filename', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ orgId: 'org_1' } as never);
    vi.mocked(getOffer).mockResolvedValue({
      id: 'offer_1',
      title: 'Tj\u00e4nst\u00e5tg\u00e4rd \u00c5\u00c4\u00d6',
      generatedDocument: '<!doctype html><html><head></head><body>pdf</body></html>',
      signatureImage: null,
      signerName: null,
      acceptedAt: null,
    } as never);
    vi.mocked(resolveOfferBrandingForOffer).mockResolvedValue({} as never);
    vi.mocked(sanitizeGeneratedOfferDocument).mockImplementation((html) => html);

    const req = new NextRequest('http://localhost/api/v1/offers/offer_1/pdf', {
      headers: { authorization: 'Bearer token' },
    });

    const res = await handleGetOfferPdf(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain(
      'filename="offert-tjanstatgard-aao.pdf"',
    );
  });
});

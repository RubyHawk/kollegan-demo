import { createHash } from 'crypto';
import {
  buildPublicOfferPdfFingerprint,
  buildPublicPdfHtml,
  PUBLIC_OFFER_PDF_RENDERER_VERSION,
} from '@modules/supporting/offers/application/offer-pdf';

describe('public offer pdf renderer', () => {
  it('injects a lean print profile for PDF output', () => {
    const html = buildPublicPdfHtml(
      '<!doctype html><html><head></head><body><div class="page-block page-block--document"><div class="offer-summary">sum</div></div></body></html>',
      'https://offert.soleria.se',
      { status: 'viewed' },
    );

    expect(html).toContain('<base href="https://offert.soleria.se/" />');
    expect(html).toContain('box-shadow: none !important;');
    expect(html).toContain('filter: none !important;');
    expect(html).toContain('.page-block--document {');
    expect(html).toContain('padding: 30px 36px 26px !important;');
    expect(html).toContain('.offer-shell__lead');
    expect(html).toContain('.page-block--document::before');
    expect(html).toContain('.offer-summary__row--total');
    expect(html).toContain('font-family: Aptos, "Segoe UI", "Helvetica Neue", Arial, sans-serif;');
  });

  it('includes the renderer version in the PDF fingerprint', () => {
    const documentHtml = '<html><body><p>Offer</p></body></html>';
    const origin = 'https://offert.soleria.se';
    const offer = {
      status: 'accepted' as const,
      signatureImage: 'data:image/png;base64,abc',
      signerName: 'Malek',
      acceptedAt: '2026-04-09T20:00:00.000Z',
    };

    const fingerprint = buildPublicOfferPdfFingerprint(documentHtml, origin, offer);
    const expected = createHash('sha1')
      .update(PUBLIC_OFFER_PDF_RENDERER_VERSION)
      .update('\n')
      .update(origin)
      .update('\n')
      .update(documentHtml)
      .update('\n')
      .update(JSON.stringify({
        status: offer.status,
        signatureImage: offer.signatureImage,
        signerName: offer.signerName,
        acceptedAt: offer.acceptedAt,
      }))
      .digest('hex');

    expect(fingerprint).toBe(expected);
  });
});

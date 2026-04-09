import {
  renderCta,
  sendToRecipientHtml,
} from '@modules/supporting/offers/application/offer-email-dispatch';

describe('offer email dispatch html', () => {
  it('renders a translation-safe CTA button', () => {
    const html = renderCta({
      bgColor: '#0f172a',
      textColor: '#ffffff',
      borderRadius: 8,
      label: 'Visa & signera offert',
    }, 'https://offert.soleria.se/abc');

    expect(html).toContain('<table role="presentation"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('translate="no"');
    expect(html).toContain('white-space:nowrap;');
  });

  it('wraps recipient emails in a swedish html document and preserves raw urls', () => {
    const html = sendToRecipientHtml({
      offerId: 'offer-1',
      offerTitle: 'Silver Solfilm',
      recipientName: 'Ali Zeytoun',
      recipientEmail: 'ali@example.com',
      publicUrl: 'https://offert.soleria.se/2f6569df-923f-4ab8-b89e-9949705eb144',
      validUntil: '2026-05-08T00:00:00.000Z',
      totalExVat: 6800,
      totalIncVat: 8500,
      priceDisplayMode: 'inclusive',
    });

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<html lang="sv" dir="ltr">');
    expect(html).toContain('<meta http-equiv="Content-Language" content="sv" />');
    expect(html).toContain('Ny offert Silver Solfilm.');
    expect(html).toContain('translate="no"');
    expect(html).toContain('<span translate="no">https://offert.soleria.se/2f6569df-923f-4ab8-b89e-9949705eb144</span>');
  });
});

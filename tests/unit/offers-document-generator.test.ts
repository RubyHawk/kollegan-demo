import {
  generateDocument,
  generateFallbackDocument,
  renderPublicOfferSummaryHtml,
  sanitizeGeneratedOfferDocument,
} from '@modules/supporting/offers/application/document-generator';
import type { Offer } from '@modules/supporting/offers/domain/offer.entity';

describe('offer document generator', () => {
  const offer: Offer = {
    id: 'offer-1',
    organizationId: 'org-1',
    title: 'Testoffert',
    status: 'draft',
    offerNumber: 42,
    priceDisplayMode: 'exclusive',
    recipientName: 'Ada Lovelace',
    recipientEmail: 'ada@example.com',
    recipientCompany: 'Analytical Engines AB',
    lineItems: [
      {
        id: 'line-3',
        description: 'Gamma Service - Sist i alfabetet men först i ordningen',
        quantity: 1,
        unitPrice: 100,
        vatRate: 0.25,
        discount: 0,
        sortOrder: 0,
      },
      {
        id: 'line-1',
        description: 'Alpha Service - Förskjuten ordning',
        quantity: 1,
        unitPrice: 200,
        vatRate: 0.25,
        discount: 0,
        sortOrder: 1,
      },
      {
        id: 'line-2',
        description: 'Beta Service - Mellanpost',
        quantity: 1,
        unitPrice: 300,
        vatRate: 0.25,
        discount: 0,
        sortOrder: 2,
      },
    ],
    notes: 'Testanteckning',
    validUntil: '2026-12-31T00:00:00.000Z',
    validityDays: 30,
    createdBy: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    reminderCount: 0,
    totalExVat: 600,
    totalIncVat: 750,
    signatureMethod: 'typed',
    publicToken: 'public-token',
  };
  const branding = {
    companyName: 'Soleria',
    senderName: 'Soleria',
    senderEmail: 'hello@soleria.se',
    website: 'www.soleria.se',
    organizationNumber: '556123-4567',
    addressLines: ['Storgatan 1', '111 22 Stockholm'],
  };

  it('keeps line items in supplied order and uses the approved wider product grid', () => {
    const html = generateFallbackDocument(offer, branding);

    const gammaIndex = html.indexOf('Gamma Service');
    const alphaIndex = html.indexOf('Alpha Service');
    const betaIndex = html.indexOf('Beta Service');

    expect(gammaIndex).toBeGreaterThan(-1);
    expect(alphaIndex).toBeGreaterThan(gammaIndex);
    expect(betaIndex).toBeGreaterThan(alphaIndex);
    expect(html).toContain('--offer-columns:minmax(0, 2.1fr) 92px 136px 86px 152px');
  });

  it('keeps product detail copy in the mobile offer cards', () => {
    const html = generateFallbackDocument(offer, branding);

    expect(html).toContain('class="offer-item-card__detail"');
    expect(html).toMatch(/offer-item-card__detail">[^<]*ordningen<\/div>/);
  });

  it('renders the quantity unit in the line item amount column', () => {
    const html = generateFallbackDocument({
      ...offer,
      lineItems: [
        {
          id: 'line-unit',
          description: 'Solfilm',
          quantity: 3,
          unit: 'm²',
          unitPrice: 1200,
          vatRate: 0.25,
          discount: 0,
          sortOrder: 0,
        },
      ],
    }, branding);

    expect(html).toContain('<dt>Antal</dt><dd>3 m&sup2;</dd>');
  });

  it('defaults the quantity unit to st when no explicit unit is stored', () => {
    const html = generateFallbackDocument(offer, branding);

    expect(html).toContain('<dt>Antal</dt><dd>1 st</dd>');
  });

  it('lets the final odd mobile metric span the full card width', () => {
    const html = generateFallbackDocument(offer, branding);

    expect(html).toContain('<div class="offer-item-card__metric offer-item-card__metric--full"><dt>Moms</dt><dd>25%</dd></div>');
  });

  it('uses À-pris in both fresh and sanitized legacy line item labels', () => {
    const fallbackHtml = generateFallbackDocument(offer, branding);
    const sanitizedLegacyHtml = sanitizeGeneratedOfferDocument(`
      <div class="offer-items__head">
        <span>Produkt eller tjänst</span>
        <span>Antal</span>
        <span>Å-pris</span>
        <span>Moms</span>
        <span>Belopp</span>
      </div>
    `, offer, branding);

    expect(fallbackHtml).toContain('&Agrave;-pris');
    expect(sanitizedLegacyHtml).toContain('À-pris');
    expect(sanitizedLegacyHtml).not.toContain('Å-pris');
  });

  it('renders summary below the pricing section and before legal terms even for legacy right placement', () => {
    const template = JSON.stringify({
      _v: 4,
      pages: [
        {
          id: 'page-1',
          label: 'Offertsida',
          kind: 'document',
          role: 'offer',
          includeInCustomerPdf: true,
          body: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Introduktion' }],
              },
            ],
          },
          header: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
          footer: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
          document: {
            showIntro: true,
            showLineItems: true,
            showSummary: true,
            showTerms: true,
            showNotes: false,
            showFooter: false,
            summaryPlacement: 'right',
          },
        },
      ],
      defaultHeader: { type: 'doc', content: [] },
      defaultFooter: { type: 'doc', content: [] },
    });

    const html = generateDocument(template, offer, branding);

    const pricingIndex = html.indexOf('<section class="offer-section offer-section--pricing">');
    const summaryIndex = html.indexOf('<aside class="offer-summary offer-summary--below">');
    const termsIndex = html.indexOf('<section class="offer-section offer-section--terms">');

    expect(pricingIndex).toBeGreaterThan(-1);
    expect(summaryIndex).toBeGreaterThan(pricingIndex);
    expect(termsIndex).toBeGreaterThan(summaryIndex);
    expect(html).not.toContain('offer-pricing-layout--split');
  });

  it('renders the footer with company, responsible and contact details', () => {
    const html = generateFallbackDocument(offer, branding);

    expect(html).toContain('<footer class="offer-shell__footer">');
    expect(html).toContain('offer-shell__footer-item--company');
    expect(html).toContain('offer-shell__footer-item--responsible');
    expect(html).toContain('offer-shell__footer-item--contact');
    expect(html).toContain('class="offer-shell__footer-icon"');
    expect(html).toContain('href="https://www.soleria.se"');
    expect(html).toContain('<span>Ansvarig</span>');
    expect(html).toContain('<span>Kontakt</span>');
    expect(html).toContain('<span>hello@soleria.se</span>');
  });

  it('re-injects missing sender branding details into legacy generated snapshots', () => {
    const legacyHtml = `<!DOCTYPE html>
<html lang="sv">
  <body>
    <div class="offer-shell__sender">
      <div class="offer-shell__sender-copy">
        <p class="offer-shell__sender-name">Soleria - Malek</p>
      </div>
    </div>
  </body>
</html>`;

    const sanitized = sanitizeGeneratedOfferDocument(legacyHtml, offer, {
      ...branding,
      logoUrl: 'https://cdn.example.com/soleria-logo.png',
    });

    expect(sanitized).toContain('class="offer-shell__logo"');
    expect(sanitized).toContain('https://cdn.example.com/soleria-logo.png');
    expect(sanitized).toContain('<p class="offer-shell__sender-name">Soleria</p>');
    expect(sanitized).toContain('<p>Org.nr 556123-4567</p>');
    expect(sanitized).toContain('<p>Storgatan 1</p>');
    expect(sanitized).toContain('<p>111 22 Stockholm</p>');
    expect(sanitized).not.toContain('Soleria - Malek');
  });

  it('renders the summary in a clearer subtotal-discount-vat-total order', () => {
    const discountedOffer: Offer = {
      ...offer,
      lineItems: [
        {
          id: 'line-discounted',
          description: 'Kampanjfilm',
          quantity: 1,
          unitPrice: 1000,
          vatRate: 0.25,
          discount: 10,
          sortOrder: 0,
        },
      ],
      totalExVat: 900,
      totalIncVat: 1125,
    };

    const html = generateFallbackDocument(discountedOffer, branding);

    const subtotalIndex = html.indexOf('offer-summary__row offer-summary__row--subtotal');
    const discountIndex = html.indexOf('offer-summary__row offer-summary__row--discount');
    const vatIndex = html.indexOf('offer-summary__row offer-summary__row--vat');
    const totalIndex = html.indexOf('offer-summary__row offer-summary__row--total');

    expect(subtotalIndex).toBeGreaterThan(-1);
    expect(discountIndex).toBeGreaterThan(subtotalIndex);
    expect(vatIndex).toBeGreaterThan(discountIndex);
    expect(totalIndex).toBeGreaterThan(vatIndex);
    expect(html).toContain('- 100,00');
  });

  it('uses the correct VAT subcopy for momsfri totalsummor', () => {
    const vatFreeSummary = renderPublicOfferSummaryHtml({
      ...offer,
      priceDisplayMode: 'inclusive',
      totalExVat: 600,
      totalIncVat: 600,
      lineItems: [
        {
          id: 'line-vat-free',
          description: 'Momsfri tjänst',
          quantity: 1,
          unitPrice: 600,
          vatRate: 0,
          discount: 0,
          sortOrder: 0,
        },
      ],
    });

    expect(vatFreeSummary).toContain('Totalsumma');
    expect(vatFreeSummary).toContain('exkl. moms');
    expect(vatFreeSummary).not.toContain('inkl. moms');
    expect(vatFreeSummary).not.toContain('offer-summary__row--vat');
  });
});

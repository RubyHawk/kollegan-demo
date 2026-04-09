import { generateDocument, generateFallbackDocument } from '@modules/supporting/offers/application/document-generator';
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

  it('keeps line items in supplied order and protects the description column', () => {
    const html = generateFallbackDocument(offer);

    const gammaIndex = html.indexOf('Gamma Service');
    const alphaIndex = html.indexOf('Alpha Service');
    const betaIndex = html.indexOf('Beta Service');

    expect(gammaIndex).toBeGreaterThan(-1);
    expect(alphaIndex).toBeGreaterThan(gammaIndex);
    expect(betaIndex).toBeGreaterThan(alphaIndex);
    expect(html).toContain('--offer-columns:minmax(220px, 1.85fr)');
  });

  it('stacks split pricing layouts instead of squeezing the line-item table', () => {
    const html = generateDocument('Detta är en fallback-mall', offer);

    expect(html).toMatch(/\.offer-pricing-layout--split\s*\{\s*grid-template-columns: minmax\(0, 1fr\) !important;/);
    expect(html).toMatch(/\.offer-pricing-layout__summary\s*\{\s*align-self: start !important;\s*width: min\(332px, 100%\) !important;/);
  });
});

import {
  calculateOfferTotals,
  formatVatRate,
  summarizeOfferPricing,
  summarizePersistedOfferPricing,
} from '@modules/supporting/offers/domain/pricing';

describe('offer pricing', () => {
  const lineItems = [
    { quantity: 5, unitPrice: 1000, vatRate: 0.25, discount: 55 },
    { quantity: 6, unitPrice: 5332.8, vatRate: 0.25, discount: 77 },
    { quantity: 88, unitPrice: 710.4, vatRate: 0.25, discount: 0 },
  ];

  it('uses the canonical total calculator for persisted totals', () => {
    expect(calculateOfferTotals(lineItems)).toEqual({
      exVat: 72124.46,
      vatAmount: 18031.12,
      incVat: 90155.58,
      discountAmount: 27387.54,
      hasVat: true,
    });
  });

  it('keeps derived summaries aligned with persisted offer totals', () => {
    const computed = summarizeOfferPricing(lineItems, 'inclusive');
    const persisted = summarizePersistedOfferPricing({
      lineItems,
      priceDisplayMode: 'inclusive',
      totalExVat: 72124.46,
      totalIncVat: 90155.58,
    });

    expect(computed.totalAmount).toBe(90155.58);
    expect(persisted.totalAmount).toBe(90155.58);
    expect(persisted.vatAmount).toBe(18031.12);
    expect(persisted.discountAmount).toBe(27387.54);
    expect(persisted.displayModeLabel).toBe('inkl. moms');
  });

  it('formats vat rates compactly for offer layouts', () => {
    expect(formatVatRate(0.25)).toBe('25%');
    expect(formatVatRate(25)).toBe('25%');
    expect(formatVatRate(0)).toBe('Momsfri');
  });
});

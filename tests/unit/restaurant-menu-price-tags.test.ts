import { describe, expect, it } from 'vitest';
import { deriveMenuVariantsFromPriceTags } from '../../src/modules/supporting/restaurant-menu';

describe('restaurant menu price tags', () => {
  it('derives POS variants from seeded Fluffy size tags', () => {
    expect(deriveMenuVariantsFromPriceTags(['S 89', 'M 149', 'L 239'])).toEqual([
      { id: 'price-tag-s', name: 'S', priceCents: 8_900, isDefault: true, isAvailable: true, sortOrder: 0 },
      { id: 'price-tag-m', name: 'M', priceCents: 14_900, isDefault: false, isAvailable: true, sortOrder: 1 },
      { id: 'price-tag-l', name: 'L', priceCents: 23_900, isDefault: false, isAvailable: true, sortOrder: 2 },
    ]);
  });

  it('keeps non-price tags out of POS variants', () => {
    expect(deriveMenuVariantsFromPriceTags(['Populär', 'Liten 74:-', 'Glutenfri'])).toEqual([
      { id: 'price-tag-liten', name: 'Liten', priceCents: 7_400, isDefault: true, isAvailable: true, sortOrder: 0 },
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import { isOrderableMenuItem, parseMenuVariants } from '../../src/shared/lib/menu/menu-variants';

describe('parseMenuVariants', () => {
  it('parses size/price tags (kronor → cents)', () => {
    expect(parseMenuVariants(['S 69', 'M 119', 'L 199'], null)).toEqual([
      { label: 'S', priceCents: 6_900 },
      { label: 'M', priceCents: 11_900 },
      { label: 'L', priceCents: 19_900 },
    ]);
    expect(parseMenuVariants(['Liten 73', 'Stor 108'], null)).toEqual([
      { label: 'Liten', priceCents: 7_300 },
      { label: 'Stor', priceCents: 10_800 },
    ]);
  });

  it('ignores non-price tags and falls back to a single priceCents', () => {
    expect(parseMenuVariants(['Glutenfri'], 18_900)).toEqual([{ label: '', priceCents: 18_900 }]);
    expect(parseMenuVariants([], 2_500)).toEqual([{ label: '', priceCents: 2_500 }]);
  });

  it('returns no variants when there is neither a price tag nor a priceCents', () => {
    expect(parseMenuVariants([], null)).toEqual([]);
    expect(parseMenuVariants(['Fråga personalen'], null)).toEqual([]);
    expect(parseMenuVariants([], 0)).toEqual([]);
  });

  it('treats availability and pricing together for orderability', () => {
    expect(isOrderableMenuItem({ tags: ['S 69'], priceCents: null, isAvailable: true })).toBe(true);
    expect(isOrderableMenuItem({ tags: ['S 69'], priceCents: null, isAvailable: false })).toBe(false);
    expect(isOrderableMenuItem({ tags: [], priceCents: null })).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { isPriceTag, parseVariantTag } from '../../src/app/(dashboard)/(shell)/meny/menu-utils';

describe('menu variant tag parsing', () => {
  it('treats "Label <number>" as a price variant', () => {
    expect(isPriceTag('S 89')).toBe(true);
    expect(isPriceTag('Liten 20')).toBe(true);
    expect(isPriceTag('Mellan 25')).toBe(true);
  });

  it('treats plain labels as badges, not prices', () => {
    expect(isPriceTag('Glutenfri')).toBe(false);
    expect(isPriceTag('Vegetarisk')).toBe(false);
    expect(isPriceTag('Nyhet')).toBe(false);
  });

  it('parses price variants into label + price', () => {
    expect(parseVariantTag('S 89')).toEqual({ label: 'S', price: '89' });
    expect(parseVariantTag('Liten 20')).toEqual({ label: 'Liten', price: '20' });
  });

  it('leaves a badge tag as a label with no price', () => {
    expect(parseVariantTag('Glutenfri')).toEqual({ label: 'Glutenfri', price: '' });
  });

  // Regression: a single-priced item that carries a badge tag (e.g. seeded
  // "Glutenfritt": priceCents=18900, tags=['Glutenfri']) must NOT be treated as
  // size-priced, or saving would null its price.
  it('does not flag a badge-only tag set as having price variants', () => {
    expect(['Glutenfri'].some(isPriceTag)).toBe(false);
    expect(['S 89', 'Glutenfri'].some(isPriceTag)).toBe(true);
    expect(['S 89', 'Glutenfri'].filter((tag) => !isPriceTag(tag))).toEqual(['Glutenfri']);
  });
});

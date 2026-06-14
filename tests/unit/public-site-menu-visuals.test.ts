import { describe, expect, it } from 'vitest';
import type { RestaurantMenuItemView } from '../../src/modules/supporting/restaurant-menu';
import { menuItemParts, menuSlug, priceParts } from '../../src/app/site/_lib/menu-visuals';

function item(overrides: Partial<RestaurantMenuItemView>): RestaurantMenuItemView {
  return {
    id: 'item-1',
    categoryId: 'category-1',
    name: 'Tacokebab',
    description: null,
    priceCents: null,
    currency: 'SEK',
    imageUrl: null,
    allergens: [],
    tags: [],
    ingredients: [],
    isAvailable: true,
    sortOrder: 1,
    ...overrides,
  };
}

describe('public site menu visuals', () => {
  it('normalizes category names for stable query tabs', () => {
    expect(menuSlug('Tillbehör och såser')).toBe('tillbehor-och-saser');
    expect(menuSlug('Dryck, snacks och dessert')).toBe('dryck-snacks-och-dessert');
  });

  it('splits menu board item numbers from display names', () => {
    expect(menuItemParts('19. Tacokebab')).toEqual({ number: '19', label: 'Tacokebab' });
    expect(menuItemParts('Glutenfritt')).toEqual({ number: null, label: 'Glutenfritt' });
  });

  it('builds price columns from seeded S/M/L tags without changing data shape', () => {
    expect(priceParts(item({ tags: ['S 89', 'M 149', 'L 239'] }))).toEqual([
      { label: 'S', value: '89' },
      { label: 'M', value: '149' },
      { label: 'L', value: '239' },
    ]);
  });

  it('keeps every published price variant for drink-style items', () => {
    expect(priceParts(item({ tags: ['Liten 20', 'Mellan 25', 'Stor 30', 'Burk 25', 'PET 35'] }))).toEqual([
      { label: 'Liten', value: '20' },
      { label: 'Mellan', value: '25' },
      { label: 'Stor', value: '30' },
      { label: 'Burk', value: '25' },
      { label: 'PET', value: '35' },
    ]);
  });

  it('falls back to a single price when an item has priceCents', () => {
    expect(priceParts(item({ priceCents: 5900 }))).toEqual([{ label: 'Pris', value: '59' }]);
  });
});

import type { RestaurantMenuCategoryView, RestaurantMenuItemView } from '@modules/supporting/restaurant-menu';

export type MenuPricePart = {
  label: string;
  value: string;
};

const CATEGORY_IMAGE_FALLBACKS = [
  { match: ['pizza', 'pizzor'], image: '/fluffys/menu/pizza-kebab-board.jpg' },
  { match: ['subs'], image: '/fluffys/menu/subs-classic-board.jpg' },
  { match: ['kebab', 'gyros'], image: '/fluffys/menu/pizza-kebab-board.jpg' },
  { match: ['panini'], image: '/fluffys/menu/panini-salad-board.jpg' },
  { match: ['sallad', 'wrap'], image: '/fluffys/menu/panini-salad-board.jpg' },
  { match: ['tillbehor', 'tillbehör', 'sås', 'sas'], image: '/fluffys/menu/sides-sauces-board.jpg' },
  { match: ['dryck', 'läsk', 'lask', 'snacks', 'dessert'], image: '/fluffys/menu/drinks-sides-board.jpg' },
];

const CATEGORY_ICON_LABELS = [
  { match: ['pizza', 'pizzor'], key: 'pizza', label: 'Pizza' },
  { match: ['subs'], key: 'subs', label: 'Subs' },
  { match: ['kebab', 'gyros'], key: 'kebab', label: 'Kebab' },
  { match: ['panini'], key: 'panini', label: 'Panini' },
  { match: ['sallad', 'wrap'], key: 'salad', label: 'Sallad' },
  { match: ['tillbehor', 'tillbehör', 'sås', 'sas'], key: 'sides', label: 'Tillbehör' },
  { match: ['dryck', 'läsk', 'lask', 'snacks', 'dessert'], key: 'drinks', label: 'Läsk' },
];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function compactKronor(priceCents: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(priceCents / 100);
}

export function menuSlug(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'meny';
}

export function menuItemParts(name: string) {
  const match = name.match(/^(\d+)\.\s*(.+)$/);
  if (!match) return { number: null, label: name };
  return { number: match[1] ?? null, label: match[2] ?? name };
}

export function priceParts(item: RestaurantMenuItemView): MenuPricePart[] {
  if (item.priceCents != null) {
    return [{ label: 'Pris', value: compactKronor(item.priceCents) }];
  }

  return item.tags.flatMap((tag) => {
    const match = tag.trim().match(/^(.+?)\s+(\d+[:-]?)$/);
    if (!match) return [];
    return [{ label: match[1] ?? '', value: match[2]?.replace(/:-$/, '') ?? '' }];
  });
}

export function itemPriceFallback(item: RestaurantMenuItemView) {
  const parts = priceParts(item);
  if (parts.length === 0) return '';
  return parts.map((part) => `${part.label} ${part.value}`).join(' / ');
}

export function categoryDisplay(category: RestaurantMenuCategoryView) {
  const key = normalize(category.name);
  const match = CATEGORY_ICON_LABELS.find((entry) => entry.match.some((candidate) => key.includes(candidate)));
  return {
    iconKey: match?.key ?? 'default',
    label: match?.label ?? category.name,
  };
}

export function categoryImage(category: RestaurantMenuCategoryView) {
  const key = normalize(category.name);
  return CATEGORY_IMAGE_FALLBACKS.find((entry) => entry.match.some((candidate) => key.includes(candidate)))?.image
    ?? '/fluffys/menu/pizza-kebab-board.jpg';
}

export function menuItemImage(category: RestaurantMenuCategoryView, item: RestaurantMenuItemView) {
  return item.imageUrl ?? categoryImage(category);
}

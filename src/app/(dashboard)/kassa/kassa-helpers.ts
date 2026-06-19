import type { RestaurantMenuCategory, RestaurantMenuItem } from '@shared/lib/api/restaurant.api';

export type DraftItem = {
  draftId: string;
  menuItemId: string | null;
  name: string;
  quantity: number;
  unitPriceCents: number;
  note: string | null;
};

const currencyFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function money(cents: number) {
  return currencyFormatter.format(cents / 100);
}

export function timeLabel(value: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function normalizePriceInput(value: string): number | null {
  const normalized = Number(value.replace(',', '.'));
  if (!Number.isFinite(normalized) || normalized < 0) return null;
  return Math.round(normalized * 100);
}

export function availableItems(category: RestaurantMenuCategory): RestaurantMenuItem[] {
  return category.items.filter((item) => item.isAvailable && item.priceCents !== null);
}

import type { RestaurantMenuCategory, RestaurantMenuItem } from '@shared/lib/api/restaurant.api';
import type { RestaurantOrderModifierSelection } from '@shared/lib/api/restaurant-orders.api';

export type DraftItem = {
  draftId: string;
  menuItemId: string | null;
  imageUrl?: string | null;
  name: string;
  quantity: number;
  variantName: string | null;
  variantPriceCents: number | null;
  selectedModifiers: RestaurantOrderModifierSelection[];
  modifierTotalCents: number;
  basePriceCents: number;
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

export function menuItemBasePrice(item: RestaurantMenuItem): number | null {
  const availableVariants = (item.variants ?? []).filter((variant) => variant.isAvailable);
  const defaultVariant = availableVariants.find((variant) => variant.isDefault) ?? availableVariants[0];
  return defaultVariant?.priceCents ?? item.priceCents;
}

export function menuItemPriceLabel(item: RestaurantMenuItem): string {
  const availableVariants = (item.variants ?? []).filter((variant) => variant.isAvailable);
  if (availableVariants.length > 1) {
    const min = Math.min(...availableVariants.map((variant) => variant.priceCents));
    return `Från ${money(min)}`;
  }
  const price = menuItemBasePrice(item);
  return price === null ? 'Pris saknas' : money(price);
}

export function modifierSummary(modifiers: RestaurantOrderModifierSelection[]): string {
  return modifiers.map((modifier) => modifier.optionName).join(', ');
}

export function availableItems(category: RestaurantMenuCategory): RestaurantMenuItem[] {
  return category.items.filter((item) => item.isAvailable && menuItemBasePrice(item) !== null);
}

export function menuItemsById(categories: RestaurantMenuCategory[]): Map<string, RestaurantMenuItem> {
  const map = new Map<string, RestaurantMenuItem>();
  for (const category of categories) {
    for (const item of category.items) map.set(item.id, item);
  }
  return map;
}

export function draftItemFromOrderItem(item: {
  id: string;
  menuItemId: string | null;
  name: string;
  quantity: number;
  variantName?: string | null;
  variantPriceCents?: number | null;
  selectedModifiers?: RestaurantOrderModifierSelection[];
  modifierTotalCents?: number;
  unitPriceCents: number;
  note: string | null;
}, menuItem?: RestaurantMenuItem | null): DraftItem {
  const modifierTotalCents = item.modifierTotalCents ?? 0;
  const basePriceCents = item.variantPriceCents ?? Math.max(0, item.unitPriceCents - modifierTotalCents);
  return {
    draftId: `order:${item.id}`,
    menuItemId: item.menuItemId,
    imageUrl: menuItem?.imageUrl ?? null,
    name: item.name,
    quantity: item.quantity,
    variantName: item.variantName ?? null,
    variantPriceCents: item.variantPriceCents ?? null,
    selectedModifiers: item.selectedModifiers ?? [],
    modifierTotalCents,
    basePriceCents,
    unitPriceCents: basePriceCents + modifierTotalCents,
    note: item.note,
  };
}

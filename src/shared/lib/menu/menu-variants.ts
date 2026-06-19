// Shared, dependency-free menu price helpers.
//
// Fluffy's mains (pizzas, subs, panini, sides) are priced per size via free-text tags such as
// "S 69" / "M 119" / "L 199" or "Liten 73" / "Stor 108", with the row's priceCents left NULL.
// Fixed-price items instead carry a single priceCents and non-price tags (or none).
//
// This module turns that into structured {label, priceCents} variants so the customer cart and the
// server-side order service share ONE price source (the menu row). The order service re-derives the
// price from the menu row at order time — the browser never supplies prices — so this stays secure.

export interface MenuVariant {
  /** Size label, e.g. "S" / "M" / "L" / "Liten" / "Stor". Empty string for single-price items. */
  label: string;
  priceCents: number;
}

// "<label> <amount>" with an optional "kr" suffix, e.g. "S 69", "Liten 73", "Stor 108 kr".
const PRICE_TAG = /^(.+?)\s+(\d{1,4})(?:\s*kr)?$/i;

export function parseMenuVariants(
  tags: readonly string[] | null | undefined,
  priceCents: number | null | undefined,
): MenuVariant[] {
  const variants: MenuVariant[] = [];
  for (const raw of tags ?? []) {
    const match = PRICE_TAG.exec(String(raw).trim());
    if (match) variants.push({ label: match[1]!.trim(), priceCents: Number(match[2]) * 100 });
  }
  if (variants.length > 0) return variants;
  if (typeof priceCents === 'number' && priceCents > 0) return [{ label: '', priceCents }];
  return [];
}

export interface OrderableLike {
  tags?: readonly string[] | null;
  priceCents?: number | null;
  isAvailable?: boolean;
}

/** An item can be ordered online when it is available and resolves to at least one priced variant. */
export function isOrderableMenuItem(item: OrderableLike): boolean {
  if (item.isAvailable === false) return false;
  return parseMenuVariants(item.tags, item.priceCents).length > 0;
}

export function formatPriceCents(priceCents: number, currency = 'SEK'): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

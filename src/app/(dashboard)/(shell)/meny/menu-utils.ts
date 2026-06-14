/** Shared formatting + form-parsing helpers for the menu manager. */

export function formatPrice(priceCents: number | null, currency: string): string {
  if (priceCents == null) return 'Pris saknas';
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(priceCents / 100);
}

export function priceSummary(priceCents: number | null, currency: string, tags: string[]): string {
  if (priceCents != null) return formatPrice(priceCents, currency);
  return tags.length > 0 ? tags.join(' / ') : 'Pris saknas';
}

export function parsePriceCents(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const price = Number(raw.replace(',', '.'));
  return Number.isFinite(price) ? Math.round(price * 100) : null;
}

export function parseTags(value: FormDataEntryValue | null): string[] {
  return String(value ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/** Whole-krona string for prefilling a price input from stored cents. */
export function priceToInput(priceCents: number | null): string {
  return priceCents == null ? '' : String(Math.round(priceCents / 100));
}

/**
 * A menu item's `tags` are overloaded: price variants like "S 89" AND plain
 * badges like "Glutenfri". This mirrors the public menu's price parser
 * (src/app/site/_lib/menu-visuals.ts): a tag is a price only if it ends with a
 * number. Everything else is a badge and must be preserved untouched so editing
 * a single-priced item never wipes its price or labels.
 */
export const PRICE_TAG_RE = /^(.+?)\s+(\d+[:-]?)$/;

export function isPriceTag(tag: string): boolean {
  return PRICE_TAG_RE.test(tag.trim());
}

export function parseVariantTag(tag: string): { label: string; price: string } {
  const match = tag.trim().match(PRICE_TAG_RE);
  if (match) return { label: match[1] ?? '', price: (match[2] ?? '').replace(/[:-]+$/, '') };
  return { label: tag.trim(), price: '' };
}

/** Common dietary/marketing badges offered as one-tap toggles in the editor. */
export const MENU_BADGES = [
  'Glutenfri', 'Laktosfri', 'Vegetarisk', 'Vegansk', 'Stark', 'Mild', 'Nyhet', 'Husets favorit',
];

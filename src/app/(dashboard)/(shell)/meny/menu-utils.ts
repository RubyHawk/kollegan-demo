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

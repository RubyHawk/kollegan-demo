/**
 * Client-side invoice pricing for live editor feedback. Mirrors the server's
 * pure domain pricing (src/modules/supporting/invoicing/domain/invoice-pricing.ts)
 * so the totals shown while editing match what the API persists on save.
 */

export interface EditableLine {
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  discount?: number | null;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeVatRate(rate?: number): number {
  if (rate === undefined || !Number.isFinite(rate) || rate <= 0) return 0;
  return rate > 1 ? rate / 100 : rate;
}

export function discountFactor(discount?: number | null): number {
  return 1 - ((discount ?? 0) / 100);
}

export function lineExVat(item: EditableLine): number {
  return item.quantity * item.unitPrice * discountFactor(item.discount);
}

export function lineIncVat(item: EditableLine): number {
  return lineExVat(item) * (1 + normalizeVatRate(item.vatRate));
}

export function computeTotals(lines: EditableLine[]) {
  let exVat = 0;
  let vat = 0;
  for (const item of lines) {
    const ex = lineExVat(item);
    exVat += ex;
    vat += ex * normalizeVatRate(item.vatRate);
  }
  const totalExVat = round(exVat);
  const totalVat = round(vat);
  return { totalExVat, totalVat, totalIncVat: round(totalExVat + totalVat) };
}

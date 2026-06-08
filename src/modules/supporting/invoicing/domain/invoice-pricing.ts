/**
 * Invoice pricing — pure total calculation.
 *
 * Mirrors the offers module pricing logic (rounding, discount %, VAT per rate)
 * but is self-contained: supporting modules must not import each other, so the
 * arithmetic is duplicated here intentionally. Money rounded to 2 decimals.
 */

export interface InvoiceLineLike {
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  discount?: number | null;
}

export interface InvoiceTotals {
  totalExVat: number;
  totalVat: number;
  totalIncVat: number;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Normalises a VAT rate to a fraction (e.g. 25 -> 0.25, 0.25 -> 0.25). */
export function normalizeVatRate(rate?: number): number {
  if (rate === undefined || !Number.isFinite(rate) || rate <= 0) return 0;
  return rate > 1 ? rate / 100 : rate;
}

/** Discount is a percentage 0–100; returns the multiplier (e.g. 10 -> 0.9). */
export function getDiscountFactor(discount?: number | null): number {
  return 1 - ((discount ?? 0) / 100);
}

function getLineExVat(item: InvoiceLineLike): number {
  // Pure arithmetic — the sign of quantity flows through. Normal invoice lines
  // carry positive quantities (the handler enforces quantity > 0), so positive
  // totals are unchanged; a credit note negates quantity, so its lines (and the
  // resulting totals) are negative, reducing the customer's balance.
  return item.quantity * item.unitPrice * getDiscountFactor(item.discount);
}

/**
 * Computes invoice totals from its line items: ex-VAT subtotal, VAT summed per
 * line rate, and the inc-VAT grand total. Totals are negative for a credit note
 * (its line quantities are negated).
 */
export function computeInvoiceTotals(lineItems: InvoiceLineLike[]): InvoiceTotals {
  let exVat = 0;
  let vat = 0;

  for (const item of lineItems) {
    const lineExVat = getLineExVat(item);
    exVat += lineExVat;
    vat += lineExVat * normalizeVatRate(item.vatRate);
  }

  const totalExVat = roundCurrency(exVat);
  const totalVat = roundCurrency(vat);
  return {
    totalExVat,
    totalVat,
    totalIncVat: roundCurrency(totalExVat + totalVat),
  };
}

export type OfferPriceDisplayMode = 'exclusive' | 'inclusive';

export const DEFAULT_OFFER_PRICE_DISPLAY_MODE: OfferPriceDisplayMode = 'exclusive';

interface PriceLineLike {
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discount?: number | null;
}

export interface OfferPricingSummary {
  exVat: number;
  vatAmount: number;
  incVat: number;
  discountAmount: number;
  hasVat: boolean;
  priceDisplayMode: OfferPriceDisplayMode;
  subtotalLabel: string;
  vatLabel: string;
  totalLabel: string;
  totalAmount: number;
  displayModeLabel: string;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeVatRate(rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return rate > 1 ? rate / 100 : rate;
}

export function getDiscountFactor(discount?: number | null): number {
  return 1 - ((discount ?? 0) / 100);
}

export function getLineExVat(item: PriceLineLike): number {
  return roundCurrency(item.quantity * item.unitPrice * getDiscountFactor(item.discount));
}

export function getLineVatAmount(item: PriceLineLike): number {
  return roundCurrency(getLineExVat(item) * normalizeVatRate(item.vatRate));
}

export function getLineIncVat(item: PriceLineLike): number {
  return roundCurrency(getLineExVat(item) + getLineVatAmount(item));
}

export function getDisplayUnitPrice(item: Pick<PriceLineLike, 'unitPrice' | 'vatRate'>, mode: OfferPriceDisplayMode): number {
  const vatRate = normalizeVatRate(item.vatRate);
  if (mode === 'inclusive' && vatRate > 0) {
    return roundCurrency(item.unitPrice * (1 + vatRate));
  }
  return roundCurrency(item.unitPrice);
}

export function fromDisplayUnitPrice(
  displayUnitPrice: number,
  vatRate: number,
  mode: OfferPriceDisplayMode,
): number {
  const normalizedVatRate = normalizeVatRate(vatRate);
  if (mode === 'inclusive' && normalizedVatRate > 0) {
    return roundCurrency(displayUnitPrice / (1 + normalizedVatRate));
  }
  return roundCurrency(displayUnitPrice);
}

export function getDisplayLineTotal(item: PriceLineLike, mode: OfferPriceDisplayMode): number {
  return mode === 'inclusive' ? getLineIncVat(item) : getLineExVat(item);
}

export function getDisplayModeLabel(hasVat: boolean, mode: OfferPriceDisplayMode): string {
  if (!hasVat) return 'momsfri';
  return mode === 'inclusive' ? 'inkl. moms' : 'exkl. moms';
}

export function summarizeOfferPricing(
  items: PriceLineLike[],
  mode: OfferPriceDisplayMode = DEFAULT_OFFER_PRICE_DISPLAY_MODE,
): OfferPricingSummary {
  let exVat = 0;
  let vatAmount = 0;
  let discountAmount = 0;
  let hasVat = false;

  for (const item of items) {
    const vatRate = normalizeVatRate(item.vatRate);
    const lineBase = Math.max(0, item.quantity) * Math.max(0, item.unitPrice);
    const lineExVat = getLineExVat(item);
    exVat += lineExVat;
    discountAmount += Math.max(0, lineBase - lineExVat);
    if (vatRate > 0) {
      hasVat = true;
      vatAmount += lineExVat * vatRate;
    }
  }

  const roundedExVat = roundCurrency(exVat);
  const roundedVatAmount = roundCurrency(vatAmount);
  const roundedIncVat = roundCurrency(roundedExVat + roundedVatAmount);
  const displayModeLabel = getDisplayModeLabel(hasVat, mode);

  return {
    exVat: roundedExVat,
    vatAmount: roundedVatAmount,
    incVat: roundedIncVat,
    discountAmount: roundCurrency(discountAmount),
    hasVat,
    priceDisplayMode: mode,
    subtotalLabel: hasVat ? 'Delsumma exkl. moms' : 'Delsumma',
    vatLabel: hasVat ? 'Moms' : 'Ingen moms',
    totalLabel: hasVat ? 'Totalsumma inkl. moms' : 'Totalsumma exkl. moms',
    totalAmount: hasVat ? roundedIncVat : roundedExVat,
    displayModeLabel,
  };
}

export function formatVatRate(rate: number): string {
  const normalizedRate = normalizeVatRate(rate);
  return normalizedRate > 0 ? `${Math.round(normalizedRate * 100)}% moms` : 'Momsfri';
}

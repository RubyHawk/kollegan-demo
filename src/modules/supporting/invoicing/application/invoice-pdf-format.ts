/**
 * Invoice PDF model + pure formatters.
 *
 * Self-contained inside the invoicing module (no offers import). Defines the view
 * model consumed by `invoice-pdf-html.ts` and the pure money/percent/quantity
 * helpers it renders with. Currency is formatted with the Swedish locale: `kr`
 * for the Nordic crowns (SEK/NOK/DKK), `€` for EUR.
 */

/** One rendered invoice line — already priced (ex-VAT and VAT computed). */
export interface InvoicePdfLine {
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  /** VAT rate as a fraction, e.g. 0.25 for 25 %. */
  vatRate: number;
  /** Discount as a percentage 0–100 (optional). */
  discount?: number;
  /** Line subtotal excluding VAT (after discount). */
  lineExVat: number;
  /** VAT amount for this line. */
  lineVat: number;
}

/**
 * ROT/RUT deduction view model. Present only when a deduction applies. `type`
 * drives the label ("ROT-avdrag" / "RUT-avdrag"); the deduction is shown as a
 * negative line under the totals and "Att betala" becomes totalIncVat − amount.
 */
export interface InvoicePdfRotRut {
  /** 'ROT' | 'RUT'. */
  type: string;
  /** Eligible labour basis, inclusive of VAT. */
  laborAmount: number;
  /** Deduction amount (subtracted from the total). */
  deductionAmount: number;
  /** Buyer personnummer (shown in the meta block). */
  buyerPersonalNumber?: string;
  /** Fastighetsbeteckning — ROT on an owned property. */
  propertyDesignation?: string;
  /** BRF org.nr — ROT in a co-op apartment. */
  housingSocietyOrgNumber?: string;
}

/** The full view model for one invoice document. */
export interface InvoicePdfModel {
  seller: {
    name: string;
    orgNumber?: string;
    vatNumber?: string;
    addressLine1?: string;
    addressLine2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    logoUrl?: string;
  };
  buyer: {
    company?: string;
    name?: string;
    email?: string;
  };
  invoiceNumber?: number;
  documentType: string;
  /** 'YYYY-MM-DD' or ISO. */
  issueDate: string;
  /** 'YYYY-MM-DD' or ISO. */
  dueDate: string;
  paymentReference?: string;
  currency: string;
  notes?: string;
  lines: InvoicePdfLine[];
  totalExVat: number;
  totalVat: number;
  totalIncVat: number;
  /** ROT/RUT deduction — present only when a deduction applies to the invoice. */
  rotRut?: InvoicePdfRotRut;
}

/** The label for a ROT/RUT deduction line: "ROT-avdrag" / "RUT-avdrag". */
export function rotRutDeductionLabel(type: string): string {
  return type === 'ROT' ? 'ROT-avdrag' : 'RUT-avdrag';
}

/**
 * The amount the buyer pays after a ROT/RUT deduction: totalIncVat − deduction.
 * With no deduction it is simply totalIncVat.
 */
export function amountToPay(totalIncVat: number, rotRut?: InvoicePdfRotRut): number {
  if (!rotRut) return totalIncVat;
  return roundCurrency(totalIncVat - rotRut.deductionAmount);
}

/** One VAT group in the breakdown table. */
export interface InvoiceVatGroup {
  /** VAT rate as a fraction, e.g. 0.25. */
  rate: number;
  /** Base (ex-VAT) sum for this rate. */
  base: number;
  /** VAT sum for this rate. */
  vat: number;
}

const CROWN_CURRENCIES = new Set(['SEK', 'NOK', 'DKK']);

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Formats an amount with sv-SE grouping and the currency suffix/symbol:
 * `kr` for SEK/NOK/DKK, `€` for EUR, otherwise the raw currency code.
 */
export function formatMoney(amount: number, currency: string): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  const code = (currency || 'SEK').toUpperCase();
  if (code === 'EUR') return `${formatted} €`;
  if (CROWN_CURRENCIES.has(code)) return `${formatted} kr`;
  return `${formatted} ${code}`;
}

/** Formats a VAT/discount rate fraction as a Swedish percent: 0.25 → "25 %". */
export function formatPercent(rate: number): string {
  const value = Number.isFinite(rate) ? rate : 0;
  const percent = new Intl.NumberFormat('sv-SE', {
    maximumFractionDigits: 2,
  }).format(value * 100);
  return `${percent} %`;
}

/** Formats a quantity with sv-SE grouping (up to 3 decimals, trailing zeros dropped). */
export function formatQuantity(qty: number): string {
  const value = Number.isFinite(qty) ? qty : 0;
  return new Intl.NumberFormat('sv-SE', {
    maximumFractionDigits: 3,
  }).format(value);
}

/**
 * Groups lines by VAT rate, summing the ex-VAT base and VAT per rate. Returns the
 * groups sorted ascending by rate so the breakdown table is stable.
 */
export function buildVatBreakdown(lines: InvoicePdfLine[]): InvoiceVatGroup[] {
  const byRate = new Map<number, InvoiceVatGroup>();

  for (const line of lines) {
    const rate = Number.isFinite(line.vatRate) ? line.vatRate : 0;
    const existing = byRate.get(rate);
    if (existing) {
      existing.base += line.lineExVat;
      existing.vat += line.lineVat;
    } else {
      byRate.set(rate, { rate, base: line.lineExVat, vat: line.lineVat });
    }
  }

  return Array.from(byRate.values())
    .map((g) => ({ rate: g.rate, base: roundCurrency(g.base), vat: roundCurrency(g.vat) }))
    .sort((a, b) => a.rate - b.rate);
}

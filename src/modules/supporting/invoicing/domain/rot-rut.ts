/**
 * ROT/RUT tax deduction — pure domain computation.
 *
 * Swedish households get a tax deduction on the LABOUR portion of home work
 * (ROT = renovation/construction, RUT = household services). The company
 * invoices the customer for (total − deduction) and reclaims the deduction from
 * Skatteverket. This module owns the arithmetic and the buyer-info rules; the
 * application service persists the result and the PDF/HUS export render it.
 *
 * Rates (statutory):
 *   RUT — 50 % of the eligible labour cost incl. VAT (annual cap 75 000 SEK/person)
 *   ROT — 30 % of the eligible labour cost incl. VAT (annual cap 50 000 SEK/person)
 *
 * The annual per-person cap is cross-invoice (across all the buyer's work) and
 * CANNOT be enforced at the invoice level — we compute the per-invoice deduction
 * only and never cap it here.
 */

import { getDiscountFactor, normalizeVatRate } from './invoice-pricing';

export const ROT_RATE = 0.30;
export const RUT_RATE = 0.50;

export type RotRutType = 'ROT' | 'RUT';

/**
 * A line item, narrowed to the fields the labour basis is computed from.
 *
 * `lineType`/`rotRutEligible` are optional so this accepts both the persisted
 * `InvoiceLineItem` (where they are required) and `InvoiceLineItemInput` (where
 * they are optional). `computeRotRut` only counts `lineType === 'labour'` AND
 * `rotRutEligible === true` lines, so an `undefined` on either is safely skipped.
 */
export interface RotRutLineLike {
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  discount?: number | null;
  lineType?: string;
  rotRutEligible?: boolean;
}

export interface RotRutResult {
  /** Eligible labour total, inclusive of VAT (the deduction basis). */
  laborAmount: number;
  /** The deduction (labourInclVat × rate), rounded to 2 decimals. */
  deductionAmount: number;
}

export interface RotRutBuyerInput {
  rotRutType: RotRutType;
  buyerPersonalNumber?: string | null;
  propertyDesignation?: string | null;
  housingSocietyOrgNumber?: string | null;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Normalises the type string to ROT/RUT, or null when not a deduction. */
export function normalizeRotRutType(value?: string | null): RotRutType | null {
  if (value === 'ROT' || value === 'RUT') return value;
  return null;
}

/** The statutory deduction rate for a type: 0.30 ROT, 0.50 RUT. */
export function rotRutRate(rotRutType: RotRutType): number {
  return rotRutType === 'ROT' ? ROT_RATE : RUT_RATE;
}

/**
 * ROT (renovation) requires a property reference (fastighetsbeteckning) OR a BRF
 * org.nr (co-op apartment). RUT (household services) needs only the personnummer.
 */
export function requiresProperty(rotRutType: RotRutType): boolean {
  return rotRutType === 'ROT';
}

/**
 * Computes the eligible labour basis and the deduction for an invoice.
 *
 * The labour basis = the sum of line items where `lineType === 'labour'` AND
 * `rotRutEligible === true`, taken INCLUSIVE of VAT (line ex-VAT × (1 + vatRate),
 * with discount applied). The deduction = round(labourInclVat × rate), where the
 * rate is 0.30 for ROT and 0.50 for RUT.
 */
export function computeRotRut(
  lineItems: RotRutLineLike[],
  rotRutType: RotRutType,
): RotRutResult {
  let labourInclVat = 0;

  for (const item of lineItems) {
    if (item.lineType !== 'labour' || !item.rotRutEligible) continue;
    const exVat = item.quantity * item.unitPrice * getDiscountFactor(item.discount);
    const inclVat = exVat * (1 + normalizeVatRate(item.vatRate));
    labourInclVat += inclVat;
  }

  const laborAmount = roundCurrency(labourInclVat);
  const deductionAmount = roundCurrency(laborAmount * rotRutRate(rotRutType));
  return { laborAmount, deductionAmount };
}

/**
 * Validates the buyer info required when a deduction is set. The personnummer is
 * always required; ROT additionally requires a property designation OR a BRF
 * org.nr. Returns `{ ok: true }` or `{ ok: false, error }` with the missing field.
 */
export function validateRotRutBuyer(
  input: RotRutBuyerInput,
): { ok: true } | { ok: false; error: string } {
  if (!input.buyerPersonalNumber || input.buyerPersonalNumber.trim() === '') {
    return { ok: false, error: 'buyerPersonalNumber (personnummer) is required for a ROT/RUT deduction' };
  }
  if (requiresProperty(input.rotRutType)) {
    const hasProperty = !!input.propertyDesignation && input.propertyDesignation.trim() !== '';
    const hasBrf = !!input.housingSocietyOrgNumber && input.housingSocietyOrgNumber.trim() !== '';
    if (!hasProperty && !hasBrf) {
      return {
        ok: false,
        error:
          'ROT requires propertyDesignation (fastighetsbeteckning) or housingSocietyOrgNumber (BRF org.nr)',
      };
    }
  }
  return { ok: true };
}

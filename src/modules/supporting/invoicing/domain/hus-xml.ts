/**
 * HUS (Husarbete) XML export — pure domain builder for Skatteverket's
 * "Begäran om utbetalning – Husarbete" (request for payment of the ROT/RUT
 * deduction the company has already granted the buyer on the invoice).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IMPORTANT — XSD CAVEAT
 * This is a STRUCTURED BEST-EFFORT representation of Skatteverket's Husarbete
 * file format, not a certified document. The exact official XSD (element names,
 * namespaces, ordering, and the e-service envelope) MUST be validated against
 * Skatteverket's current specification before any live submission. Skatteverket
 * accepts the file through its e-service via BankID upload — there is no open
 * public API — so this export produces a reviewable file, never an auto-filing.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The builder is pure: it takes a plain claim view and returns an XML string.
 * All dynamic values are XML-escaped so malformed or hostile input cannot break
 * the document structure.
 */

import type { RotRutType } from './rot-rut';

/** The data needed to render one Husarbete payment-request document. */
export interface HusClaim {
  /** ROT or RUT — the work category claimed. */
  rotRutType: RotRutType;
  /** Invoice number the claim relates to (for traceability). */
  invoiceNumber?: number;
  /** Performer (the selling company). */
  performerName: string;
  /** Performer org.nr (the company that did the work and claims the payment). */
  performerOrgNumber?: string;
  /** Buyer personnummer (the household claiming the deduction). */
  buyerPersonalNumber: string;
  /** Fastighetsbeteckning — ROT on an owned property. */
  propertyDesignation?: string;
  /** BRF org.nr — ROT in a co-op apartment. */
  housingSocietyOrgNumber?: string;
  /** Amount the buyer actually paid (totalIncVat − deduction). */
  paidByBuyer: number;
  /** Requested deduction (rotRutDeductionAmount) — what Skatteverket pays out. */
  requestedAmount: number;
  /** Currency code (e.g. SEK). */
  currency: string;
}

/** Escapes the five XML predefined entities for safe text/attribute content. */
export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/** Formats a money amount as a fixed 2-decimal string with a dot separator. */
function formatAmount(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return (Math.round(safe * 100) / 100).toFixed(2);
}

/** Renders one `<tag>value</tag>` element, escaping the value. Skipped when empty. */
function el(tag: string, value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  return `<${tag}>${escapeXml(String(value))}</${tag}>`;
}

/**
 * Builds the Husarbete payment-request XML for one invoice's ROT/RUT claim.
 *
 * Structure (best-effort — validate against the official XSD before live use):
 *   <HusarbeteBegaranUtbetalning>
 *     <Arbete>ROT|RUT</Arbete>
 *     <Fakturanummer/>            (when available)
 *     <Utforare>                  (the performer / company)
 *       <Namn/> <Organisationsnummer/>
 *     </Utforare>
 *     <Kopare>                    (the buyer / household)
 *       <Personnummer/>
 *       <Fastighetsbeteckning/>   (ROT, owned property)  — or
 *       <BrfOrganisationsnummer/> (ROT, co-op apartment)
 *     </Kopare>
 *     <BetaltAvKopare/>           (amount the buyer paid)
 *     <BegartBelopp/>             (requested deduction)
 *     <Valuta/>
 *   </HusarbeteBegaranUtbetalning>
 */
export function buildHusXml(claim: HusClaim): string {
  const propertyEl = claim.propertyDesignation
    ? el('Fastighetsbeteckning', claim.propertyDesignation)
    : el('BrfOrganisationsnummer', claim.housingSocietyOrgNumber);

  return `<?xml version="1.0" encoding="UTF-8"?>
<HusarbeteBegaranUtbetalning>
  ${el('Arbete', claim.rotRutType)}
  ${el('Fakturanummer', claim.invoiceNumber)}
  <Utforare>
    ${el('Namn', claim.performerName)}
    ${el('Organisationsnummer', claim.performerOrgNumber)}
  </Utforare>
  <Kopare>
    ${el('Personnummer', claim.buyerPersonalNumber)}
    ${propertyEl}
  </Kopare>
  ${el('BetaltAvKopare', formatAmount(claim.paidByBuyer))}
  ${el('BegartBelopp', formatAmount(claim.requestedAmount))}
  ${el('Valuta', claim.currency)}
</HusarbeteBegaranUtbetalning>
`;
}

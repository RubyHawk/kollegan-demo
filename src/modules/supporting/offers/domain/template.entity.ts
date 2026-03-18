/**
 * Offer Template — domain type.
 *
 * Templates are WYSIWYG-authored documents (TipTap JSON) with {{placeholder}}
 * variables. Content is rendered to HTML at offer-send time and stored as an
 * immutable snapshot in Offer.generatedDocument.
 *
 * Predefined placeholders:
 *   {{offerTitle}}       → offer title
 *   {{quoteNumber}}      → short reference number (first 8 chars of offer ID, uppercased)
 *   {{createdDate}}      → offer creation date (sv-SE locale)
 *   {{recipientName}}    → recipient's full name
 *   {{recipientEmail}}   → recipient's email
 *   {{recipientCompany}} → recipient's company (empty string if not set)
 *   {{totalExVat}}       → formatted total ex. VAT (SEK)
 *   {{totalIncVat}}      → formatted total inc. VAT (SEK)
 *   {{vatAmount}}        → formatted VAT amount (SEK)
 *   {{validUntil}}       → formatted expiry date (sv-SE locale)
 *   {{notes}}            → offer notes (empty string if not set)
 *   {{lineItems}}        → HTML <table> of line items
 *   {{signature}}        → styled sign-here box (replaced by image after signing)
 */

export interface OfferTemplate {
  id:             string;
  organizationId: string;
  name:           string;
  content:        string; // TipTap JSON serialized as string
  emailSubject?:  string; // Custom email subject (supports {{placeholder}} variables)
  emailBody?:     string; // Custom email body HTML (supports {{placeholder}} variables)
  createdBy:      string; // User.id
  createdAt:      string; // ISO
  updatedAt:      string; // ISO
}

export const OFFER_PLACEHOLDERS = [
  // ── Document metadata ──
  { key: '{{offerNumber}}',      label: 'Offertnummer (ÅÅÅÅ-NNN)' },
  { key: '{{offerTitle}}',       label: 'Offertrubrik' },
  { key: '{{quoteNumber}}',      label: 'Offertnummer (alias)' },
  { key: '{{createdDate}}',      label: 'Skapad datum' },
  { key: '{{validUntil}}',       label: 'Giltig till' },
  // ── Recipient ──
  { key: '{{recipientName}}',    label: 'Mottagarens namn' },
  { key: '{{recipientEmail}}',   label: 'Mottagarens e-post' },
  { key: '{{recipientCompany}}', label: 'Mottagarens företag' },
  // ── Pricing ──
  { key: '{{totalExVat}}',       label: 'Summa ex. moms' },
  { key: '{{totalIncVat}}',      label: 'Summa inkl. moms' },
  { key: '{{vatAmount}}',        label: 'Momsbelopp' },
  // ── Content ──
  { key: '{{notes}}',            label: 'Anteckningar' },
  { key: '{{lineItems}}',        label: 'Radartiklar (tabell)' },
  { key: '{{signature}}',        label: 'Signaturfält' },
] as const;

export type PlaceholderKey = (typeof OFFER_PLACEHOLDERS)[number]['key'];

// ── Variable node definitions (used by BlocksSidebar) ─────────────────────────

export interface VariableNodeDef {
  key:   string;  // e.g. 'recipientName' (without {{ }})
  label: string;  // e.g. 'Mottagarens namn'
}

export const VARIABLE_NODES: VariableNodeDef[] = OFFER_PLACEHOLDERS.map((p) => ({
  key:   p.key.replace(/[{}]/g, ''),
  label: p.label,
}));

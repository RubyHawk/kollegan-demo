/**
 * Offer / Quotation Builder Module — Types
 *
 * Future ERP module for creating professional quotes and proposals.
 *
 * Planned features:
 *  - Create offers from leads or CRM contacts
 *  - Line items: rooms, services, packages, custom items
 *  - Dynamic pricing and discount rules
 *  - PDF generation and email delivery
 *  - Digital acceptance / e-signature flow
 *  - Offer versioning and expiry tracking
 *  - Integration with Leads module (offer → won)
 *  - n8n workflow: auto-send offers, follow-up reminders
 */

export type OfferStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';

export interface OfferLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;   // SEK
  vatRate: number;     // 0.25 = 25%
  discount?: number;   // percentage 0–100
}

export interface Offer {
  id: string;
  title: string;
  status: OfferStatus;
  offerNumber?: number;          // sequential per org, assigned on first send
  recipientName: string;
  recipientEmail: string;
  recipientCompany?: string;
  lineItems: OfferLineItem[];
  notes?: string;
  validUntil: string;       // ISO date (recomputed as sentAt + validityDays when sent)
  validityDays: number;     // preset window: 7 | 14 | 30 | 60 | 90
  createdBy: string;        // StaffUser.id
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  reminderSentAt?: string;       // ISO — last reminder timestamp
  reminderCount: number;         // how many reminders have been sent
  leadId?: string;          // Link to Leads module
  customerId?: string;      // Link to CRM module
  totalExVat: number;
  totalIncVat: number;
  // Template & document fields
  templateId?: string;
  generatedDocument?: string;    // immutable HTML snapshot (set at send time)
  emailSubject?: string;         // custom email subject (snapshot, set at send time)
  emailBody?: string;            // custom email body HTML (snapshot, set at send time)
  signatureImage?: string;       // data URL of the recipient's e-signature
  signerName?: string;           // name typed by the signer at signing time
  signatureMethod: string;       // "canvas" (SES) | "bankid" (AdES) — future
  publicToken: string;           // UUID used as the signing URL token
  publicTokenExpiresAt?: string; // ISO — 30 days after sentAt
}

// ─── Product / Service Library ────────────────────────────────────────────────

export interface OfferProduct {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  unitPrice: number;    // SEK, ex VAT
  vatRate: number;      // 0.25 = 25%
  unit?: string;        // "st", "tim", "mån", etc.
  createdBy: string;
  createdAt: string;
}

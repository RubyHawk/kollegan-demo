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
export type OfferPriceDisplayMode = 'exclusive' | 'inclusive';

export interface OfferLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discount?: number;
}

export interface Offer {
  id: string;
  organizationId: string;
  title: string;
  status: OfferStatus;
  offerNumber?: number;
  priceDisplayMode: OfferPriceDisplayMode;
  recipientName: string;
  recipientEmail: string;
  recipientCompany?: string;
  lineItems: OfferLineItem[];
  notes?: string;
  validUntil: string;
  validityDays: number;
  createdBy: string;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  reminderSentAt?: string;
  reminderCount: number;
  leadId?: string;
  customerId?: string;
  companyId?: string;
  totalExVat: number;
  totalIncVat: number;
  templateId?: string;
  generatedDocument?: string;
  emailSubject?: string;
  emailBody?: string;
  emailHeaderConfig?: string;
  signatureImage?: string;
  signerName?: string;
  signatureMethod: string;
  publicToken: string;
  publicTokenExpiresAt?: string;
}

export interface ProductCategory {
  id: string;
  organizationId: string;
  name: string;
  parentId: string | null;
  children?: ProductCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface OfferProduct {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  unitPrice: number;
  vatRate: number;
  unit?: string;
  sku?: string;
  category?: string;
  categoryId?: string;
  imageUrl?: string;
  isActive: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  createdBy: string;
  createdAt: string;
}

export interface Company {
  id: string;
  organizationId: string;
  name: string;
  orgNumber?: string;
  website?: string;
  logoUrl?: string;
  industry?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

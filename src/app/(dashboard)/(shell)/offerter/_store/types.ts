/**
 * Shared types for the offers page stores.
 * Exported so both the list/form stores and the page component can share the same shapes.
 */

export type OfferStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
export type OfferPriceDisplayMode = 'exclusive' | 'inclusive';

export interface LineItem {
  id?:         string;
  description: string;
  quantity:    number;
  unitPrice:   number;
  vatRate:     number;
  discount:    number;
}

export interface Offer {
  id:                   string;
  organizationId:       string;
  offerNumber:          number | null;
  priceDisplayMode:     OfferPriceDisplayMode;
  title:                string;
  status:               OfferStatus;
  recipientName:        string;
  recipientEmail:       string;
  recipientCompany?:    string;
  totalExVat:           number;
  totalIncVat:          number;
  lineItems:            LineItem[];
  createdAt:            string;
  sentAt?:              string;
  viewedAt?:            string;
  acceptedAt?:          string;
  declinedAt?:          string;
  reminderSentAt?:      string;
  reminderCount:        number;
  leadId?:              string;
  companyId?:           string;
  templateId?:          string;
  publicToken:          string;
  publicTokenExpiresAt?: string;
  notes?:               string;
  validUntil?:          string;
  validityDays?:        number;
}

export interface OfferTemplate {
  id:            string;
  name:          string;
  content?:      string;
  emailSubject?: string;
  emailBody?:    string;
}

export interface OfferProduct {
  id:           string;
  name:         string;
  description?: string;
  unitPrice:    number;
  vatRate:      number;
  unit?:        string;
}

export interface ContactResult {
  id:      string;
  name:    string | null;
  email:   string | null;
  company: string | null;
}

export interface CompanyResult {
  id:        string;
  name:      string;
  orgNumber?: string | null;
}

export interface BulkResult { sent: number; failed: number }

export interface OfferForm {
  templateId:       string;
  priceDisplayMode: OfferPriceDisplayMode;
  contactId:        string;
  companyId:        string;
  title:            string;
  recipientName:    string;
  recipientEmail:   string;
  recipientCompany: string;
  notes:            string;
  validityDays:     number;
  lineItems:        LineItem[];
}

export interface ServiceForm {
  name:        string;
  description: string;
  unitPrice:   number;
  vatRate:     number;
  unit:        string;
}

export const EMPTY_LINE: LineItem = { description: '', quantity: 1, unitPrice: 0, vatRate: 0.25, discount: 0 };

export const EMPTY_FORM: OfferForm = {
  templateId: '', priceDisplayMode: 'inclusive', contactId: '', companyId: '', title: '', recipientName: '',
  recipientEmail: '', recipientCompany: '', notes: '',
  validityDays: 30, lineItems: [{ ...EMPTY_LINE }],
};

export const EMPTY_SERVICE_FORM: ServiceForm = {
  name: '', description: '', unitPrice: 0, vatRate: 0.25, unit: '',
};

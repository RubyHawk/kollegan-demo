/**
 * Shared types for the offers page stores.
 * Exported so both the list/form stores and the page component can share the same shapes.
 */

import type {
  OfferLineItem as LineItem,
  OfferPriceDisplayMode,
} from '@shared/lib/api/offers.api';

export type {
  Offer,
  OfferLineItem as LineItem,
  OfferPriceDisplayMode,
  OfferProjectStage,
  OfferProjectSummary,
  OfferStatus,
} from '@shared/lib/api/offers.api';

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
  kind?:   'customer' | 'lead';
  name:    string | null;
  email:   string | null;
  phone?:  string | null;
  company: string | null;
  leadId?: string | null;
  customerId?: string | null;
  requestedService?: string | null;
  sourceLabel?: string | null;
  hasOffer?: boolean;
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
  leadId:           string;
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
  leadId: '',
  recipientEmail: '', recipientCompany: '', notes: '',
  validityDays: 30, lineItems: [{ ...EMPTY_LINE }],
};

export const EMPTY_SERVICE_FORM: ServiceForm = {
  name: '', description: '', unitPrice: 0, vatRate: 0.25, unit: '',
};

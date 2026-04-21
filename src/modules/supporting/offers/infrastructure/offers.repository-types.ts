export interface CreateOfferInput {
  organizationId:   string;
  title:            string;
  priceDisplayMode?: 'exclusive' | 'inclusive';
  recipientName:    string;
  recipientEmail:   string;
  recipientCompany?: string;
  notes?:           string;
  validUntil:       Date;
  validityDays:     number;
  createdBy:        string;
  leadId?:          string;
  customerId?:      string;
  companyId?:       string;
  templateId?:      string;
  generatedDocument?: string;
  generatedPdf?:      Uint8Array;
  generatedPdfFingerprint?: string;
  emailSubject?:      string;
  emailBody?:         string;
  emailHeaderConfig?: string;
  lineItems: Array<{
    description: string;
    quantity:    number;
    unitPrice:   number;
    vatRate:     number;
    discount?:   number;
    productId?:  string;
    unit?:       string;
    sortOrder?:  number;
  }>;
}

export interface UpdateOfferInput {
  title?:                string;
  priceDisplayMode?:     'exclusive' | 'inclusive';
  recipientName?:        string;
  recipientEmail?:       string;
  recipientCompany?:     string;
  notes?:                string;
  validUntil?:           Date;
  validityDays?:         number;
  status?:               string;
  offerNumber?:          number;
  sentAt?:               Date;
  viewedAt?:             Date;
  acceptedAt?:           Date;
  declinedAt?:           Date;
  reminderSentAt?:       Date;
  reminderCount?:        number;
  companyId?:            string;
  generatedDocument?:    string;
  generatedPdf?:         Uint8Array;
  generatedPdfFingerprint?: string | null;
  emailSubject?:         string;
  emailBody?:            string;
  emailHeaderConfig?:    string;
  signatureImage?:       string;
  signerName?:           string;
  publicTokenExpiresAt?: Date;
  lineItems?: Array<{
    id?:         string; // present = update; absent = insert
    description: string;
    quantity:    number;
    unitPrice:   number;
    vatRate:     number;
    discount?:   number;
    productId?:  string | null;
    unit?:       string | null;
    sortOrder?:  number;
  }>;
}

export interface ListOffersFilter {
  status?:   string;
  search?:   string;
  leadId?:   string;
  limit?:    number;
  offset?:   number;
  dateFrom?: string; // ISO date string YYYY-MM-DD (inclusive)
  dateTo?:   string; // ISO date string YYYY-MM-DD (inclusive)
}

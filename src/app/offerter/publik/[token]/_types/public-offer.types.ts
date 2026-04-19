export type OfferStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';

export type PublicOfferRendererVariant = 'legacy' | 'next';

export interface PublicOfferLineItem {
  quantity: number;
  unit?: string;
  unitPrice: number;
  vatRate: number;
  discount?: number;
}

export interface PublicOffer {
  id: string;
  title: string;
  status: OfferStatus;
  priceDisplayMode: 'exclusive' | 'inclusive';
  recipientName: string;
  recipientEmail: string;
  recipientCompany?: string;
  totalExVat: number;
  totalIncVat: number;
  lineItems: PublicOfferLineItem[];
  validUntil: string;
  notes?: string;
  generatedDocument?: string;
  publicToken: string;
  publicTokenExpiresAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  signerName?: string;
  signatureImage?: string;
  rendererVariant?: PublicOfferRendererVariant;
}

export type PageState = 'loading' | 'ready' | 'declining' | 'signing' | 'accepted' | 'declined' | 'expired' | 'error';

export type SigMode = 'draw' | 'type';

export type SignatureFields = {
  image?: string;
  name?: string;
  date?: string;
};

export interface PublicOfferViewedResult {
  status: OfferStatus;
  viewedAt?: string | null;
}

export interface PublicOfferSignResult {
  status: OfferStatus;
  acceptedAt?: string | null;
}

export interface PublicOfferDeclineResult {
  status: OfferStatus;
  declinedAt?: string | null;
}

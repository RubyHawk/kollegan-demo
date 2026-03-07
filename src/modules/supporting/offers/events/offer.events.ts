// ─── Offer domain events ──────────────────────────────────────────────────────

export const OFFER_CREATED  = 'offer.created'  as const;
export const OFFER_SENT     = 'offer.sent'     as const;
export const OFFER_VIEWED   = 'offer.viewed'   as const;
export const OFFER_ACCEPTED = 'offer.accepted' as const;
export const OFFER_DECLINED = 'offer.declined' as const;
export const OFFER_EXPIRED  = 'offer.expired'  as const;

export interface OfferCreatedEvent {
  type: typeof OFFER_CREATED;
  orgId: string;
  occurredAt: string;
  payload: { offerId: string; title: string; recipientEmail: string; leadId?: string };
}

export interface OfferSentEvent {
  type: typeof OFFER_SENT;
  orgId: string;
  occurredAt: string;
  payload: { offerId: string; recipientEmail: string; totalIncVat: number };
}

export interface OfferAcceptedEvent {
  type: typeof OFFER_ACCEPTED;
  orgId: string;
  occurredAt: string;
  payload: { offerId: string; totalIncVat: number; leadId?: string };
}

export interface OfferDeclinedEvent {
  type: typeof OFFER_DECLINED;
  orgId: string;
  occurredAt: string;
  payload: { offerId: string };
}

export type OfferEvent =
  | OfferCreatedEvent
  | OfferSentEvent
  | OfferAcceptedEvent
  | OfferDeclinedEvent;

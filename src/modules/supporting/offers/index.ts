/**
 * Offer / Quotation Builder Module — public interface.
 *
 * Other modules ONLY import from this file.
 */

// Domain types
export type { Offer, OfferLineItem, OfferStatus } from './domain/offer.entity';

// Application use cases
export {
  createOffer,
  getOffer,
  listOffers,
  updateOffer,
  sendOffer,
  acceptOffer,
  declineOffer,
  deleteOffer,
} from './application/offers.service';
export type { CreateOfferInput, UpdateOfferInput, ListOffersFilter } from './application/offers.service';

// Domain events
export {
  OFFER_CREATED,
  OFFER_SENT,
  OFFER_VIEWED,
  OFFER_ACCEPTED,
  OFFER_DECLINED,
  OFFER_EXPIRED,
} from './events/offer.events';
export type {
  OfferEvent,
  OfferCreatedEvent,
  OfferSentEvent,
  OfferAcceptedEvent,
  OfferDeclinedEvent,
} from './events/offer.events';

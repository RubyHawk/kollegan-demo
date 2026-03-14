/**
 * Offer / Quotation Builder Module — public interface.
 *
 * Other modules ONLY import from this file.
 */

// Domain types
export type { Offer, OfferLineItem, OfferStatus } from './domain/offer.entity';
export type { OfferTemplate, PlaceholderKey }      from './domain/template.entity';
export { OFFER_PLACEHOLDERS }                       from './domain/template.entity';

// Application use cases — offers
export {
  createOffer,
  getOffer,
  listOffers,
  updateOffer,
  sendOffer,
  viewOffer,
  signOffer,
  declineOfferByToken,
  acceptOffer,
  declineOffer,
  deleteOffer,
  duplicateOffer,
  expireStaleOffers,
} from './application/offers.service';
export type { CreateOfferInput, UpdateOfferInput, ListOffersFilter } from './application/offers.service';

// Application use cases — templates
export {
  createTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
  deleteTemplate,
} from './application/templates.service';

// Document generator (server-side only)
export { generateDocument } from './application/document-generator';

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

// Job registration — call once at app startup
export { registerOfferEmailJobs } from './jobs/offer-email.jobs';

// ── API Handlers — offers ─────────────────────────────────────────────────────
export {
  handleListOffers,
  handleCreateOffer,
  handleGetOffer,
  handleUpdateOffer,
  handleDeleteOffer,
  handleExpireOffers,
} from './api/handlers/offer.handler';

// ── API Handlers — templates ──────────────────────────────────────────────────
export {
  handleListTemplates,
  handleCreateTemplate,
  handleGetTemplate,
  handleUpdateTemplate,
  handleDeleteTemplate,
} from './api/handlers/template.handler';

// ── API Handlers — public signing flow ────────────────────────────────────────
export {
  handleGetPublicOffer,
  handleSignPublicOffer,
  handleDeclinePublicOffer,
} from './api/handlers/public-offer.handler';

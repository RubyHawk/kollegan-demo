/**
 * Offer / Quotation Builder Module — public interface.
 *
 * Other modules ONLY import from this file.
 */

// Domain types
export type { Offer, OfferLineItem, OfferStatus, OfferProduct, ProductCategory, Company } from './domain/offer.entity';
export type { OfferTemplate, PlaceholderKey }      from './domain/template.entity';
export { OFFER_PLACEHOLDERS }                       from './domain/template.entity';

// Application use cases — offers
export {
  createOffer,
  getOffer,
  listOffers,
  countOffers,
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
  bulkSendOffers,
  sendOfferReminder,
} from './application/offers.service';
export type { BulkSendResult } from './application/offers.service';
export type { CreateOfferInput, UpdateOfferInput, ListOffersFilter } from './application/offers.service';

// Application use cases — products
export {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from './application/products.service';
export type { CreateProductInput, UpdateProductInput } from './infrastructure/products.repository';

// Application use cases — product categories
export {
  listProductCategoryTree,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from './application/product-categories.service';
export type { CreateCategoryInput, UpdateCategoryInput } from './infrastructure/product-categories.repository';

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
  handleCountOffers,
  handleCreateOffer,
  handleGetOffer,
  handleUpdateOffer,
  handleDeleteOffer,
  handleExpireOffers,
  handleBulkSendOffers,
} from './api/handlers/offer.handler';

// ── API Handlers — templates ──────────────────────────────────────────────────
export {
  handleListTemplates,
  handleCreateTemplate,
  handleGetTemplate,
  handleUpdateTemplate,
  handleDeleteTemplate,
} from './api/handlers/template.handler';

// ── API Handlers — products ────────────────────────────────────────────────────
export {
  handleListProducts,
  handleCreateProduct,
  handleUpdateProduct,
  handleDeleteProduct,
} from './api/handlers/product.handler';

// ── API Handlers — product categories ─────────────────────────────────────────
export {
  handleListProductCategories,
  handleCreateProductCategory,
  handleUpdateProductCategory,
  handleDeleteProductCategory,
} from './api/handlers/product-categories.handler';

// ── API Handlers — companies ───────────────────────────────────────────────────
export {
  handleListCompanies,
  handleGetCompany,
  handleCreateCompany,
  handleUpdateCompany,
  handleDeleteCompany,
} from './api/handlers/company.handler';

// ── API Handlers — public signing flow ────────────────────────────────────────
export {
  handleGetPublicOffer,
  handleSignPublicOffer,
  handleDeclinePublicOffer,
} from './api/handlers/public-offer.handler';

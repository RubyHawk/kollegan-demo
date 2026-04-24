/**
 * Offer / Quotation Builder Module — public interface.
 *
 * Other modules ONLY import from this file.
 */

export type {
  Offer,
  OfferLineItem,
  OfferStatus,
  OfferPriceDisplayMode,
  OfferProduct,
  ProductCategory,
  Company,
  CompanyMember,
  CompanyMemberUser,
} from './domain/offer.entity';
export type { OfferTemplate, PlaceholderKey } from './domain/template.entity';
export { OFFER_PLACEHOLDERS } from './domain/template.entity';
export {
  DEFAULT_OFFER_PRICE_DISPLAY_MODE,
  formatVatRate,
  fromDisplayUnitPrice,
  getDisplayLineTotal,
  getDisplayModeLabel,
  getDisplayUnitPrice,
  getLineExVat,
  getLineIncVat,
  getLineVatAmount,
  summarizeOfferPricing,
} from './domain/pricing';
export type { OfferPricingSummary } from './domain/pricing';

export {
  createOffer,
  getOffer,
  getStaffOfferDetail,
  listOffers,
  countOffers,
  updateOffer,
  sendOffer,
  viewOffer,
  markOfferViewed,
  signOffer,
  declineOfferByToken,
  acceptOffer,
  acceptOfferOnBehalfForStaff,
  declineOffer,
  deleteOffer,
  duplicateOffer,
  expireStaleOffers,
  bulkSendOffers,
  sendOfferReminder,
} from './application/offers.service';
export type { BulkSendResult, StaffOfferAcceptResult, StaffOfferDetail } from './application/offers.service';
export type { CreateOfferInput, UpdateOfferInput, ListOffersFilter } from './application/offers.service';

export {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from './application/products.service';
export type { CreateProductInput, UpdateProductInput } from './infrastructure/products.repository';

export {
  listProductCategoryTree,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from './application/product-categories.service';
export type { CreateCategoryInput, UpdateCategoryInput } from './infrastructure/product-categories.repository';

export {
  createTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
  deleteTemplate,
} from './application/templates.service';

export { generateDocument } from './application/document-generator';

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

export { registerOfferEmailJobs } from './jobs/offer-email.jobs';

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

export {
  handleListTemplates,
  handleCreateTemplate,
  handleGetTemplate,
  handleUpdateTemplate,
  handleDeleteTemplate,
} from './api/handlers/template.handler';
export { handlePreviewTemplate } from './api/handlers/template-preview.handler';
export { handleUploadTemplateAsset } from './api/handlers/template-assets.handler';

export {
  handleListProducts,
  handleCreateProduct,
  handleUpdateProduct,
  handleDeleteProduct,
} from './api/handlers/product.handler';

export {
  handleListProductCategories,
  handleCreateProductCategory,
  handleUpdateProductCategory,
  handleDeleteProductCategory,
} from './api/handlers/product-categories.handler';

export {
  handleListCompanies,
  handleGetCompany,
  handleCreateCompany,
  handleUpdateCompany,
  handleDeleteCompany,
} from './api/handlers/company.handler';

export {
  handleListCompanyMembers,
  handleUpsertCompanyMember,
  handleDeleteCompanyMember,
} from './api/handlers/company-members.handler';

export {
  handleGetPublicOffer,
  handleMarkPublicOfferViewed,
  handleSignPublicOffer,
  handleDeclinePublicOffer,
} from './api/handlers/public-offer.handler';
export { handleGetPublicOfferPdf } from './api/handlers/public-offer-pdf.handler';

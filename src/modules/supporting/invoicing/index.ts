/**
 * Invoicing Module (M3) — public interface.
 *
 * Native invoice generation: draft CRUD, gapless-at-issue numbering, issue/send
 * and mark-paid transitions, and create-from-offer / create-from-project-time.
 * Other modules ONLY import from this file; internals are not imported directly.
 */

export type {
  Invoice,
  InvoiceLineItem,
  InvoiceLineItemInput,
  CreateInvoiceInput,
  CreateBlankInvoiceInput,
  CreateInvoiceFromOfferInput,
  CreateInvoiceFromTimeInput,
  UpdateInvoiceInput,
  ListInvoicesFilter,
} from './domain/invoice.entity';
export type { InvoiceStatus } from './domain/invoice-status';
export {
  INVOICE_STATUSES,
  canEdit,
  canDelete,
  canSend,
  canMarkPaid,
  canCredit,
  isInvoiceStatus,
} from './domain/invoice-status';
export { computeInvoiceTotals } from './domain/invoice-pricing';
export type { InvoiceTotals } from './domain/invoice-pricing';

export {
  createInvoice,
  listInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
  issueInvoice,
  markInvoicePaid,
} from './application/invoice.service';

export { createCreditNote } from './application/invoice-credit.service';
export type { CreateCreditNoteOptions } from './application/invoice-credit.service';

export {
  assignInvoiceNumber,
  previewNextInvoiceNumber,
} from './application/invoice-numbering.service';

export { INVOICE_SENT, INVOICE_PAID } from './events/invoice.events';
export type { InvoiceEvent, InvoiceSentEvent, InvoicePaidEvent } from './events/invoice.events';

export {
  handleListInvoices,
  handleGetInvoice,
  handleCreateInvoice,
  handleUpdateInvoice,
  handleDeleteInvoice,
  handleSendInvoice,
  handleMarkInvoicePaid,
  handleCreateCreditNote,
} from './api/handlers/invoice.handler';

export { handleGetInvoicePdf } from './api/handlers/invoice-pdf.handler';

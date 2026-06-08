import {
  handleDeleteInvoice,
  handleGetInvoice,
  handleUpdateInvoice,
} from '@modules/supporting/invoicing';

export const GET = handleGetInvoice;
export const PUT = handleUpdateInvoice;
export const PATCH = handleUpdateInvoice;
export const DELETE = handleDeleteInvoice;

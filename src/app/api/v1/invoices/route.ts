import {
  handleCreateInvoice,
  handleListInvoices,
} from '@modules/supporting/invoicing';

export const GET = handleListInvoices;
export const POST = handleCreateInvoice;

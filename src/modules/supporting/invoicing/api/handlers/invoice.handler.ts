/**
 * Invoice API handlers — colocated with the invoicing module.
 *
 * app/api/v1/invoices/ routes are thin re-export wrappers that point here.
 * Handlers own auth (JWT), RBAC permission, Zod validation, and response shape.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok, created } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import { INVOICE_STATUSES, type InvoiceStatus } from '../../domain/invoice-status';
import {
  createInvoice,
  deleteInvoice,
  getInvoice,
  listInvoices,
  markInvoicePaid,
  sendInvoice,
  updateInvoice,
} from '../../application/invoice.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

function extractId(req: NextRequest): string {
  // For nested action routes (…/[id]/send) the id is the second-to-last segment.
  const segments = req.nextUrl.pathname.split('/').filter(Boolean);
  const last = segments.at(-1) ?? '';
  if (last === 'send' || last === 'mark-paid') return segments.at(-2) ?? '';
  return last;
}

async function requireStaff(req: NextRequest) {
  const payload = await verifyToken(extractToken(req));
  if (!payload.orgId) throw Errors.forbidden('No organization context');
  return payload;
}

function invoiceLocation(id: string): string {
  return `/api/v1/invoices/${id}`;
}

// ── Shared schema pieces ──────────────────────────────────────────────────────

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const LineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unit: z.string().max(50).optional().nullable(),
  unitPrice: z.number().min(0),
  vatRate: z.number().min(0).max(1).optional(),
  discount: z.number().min(0).max(100).optional().nullable(),
  productId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().optional(),
  lineType: z.string().max(50).optional(),
  rotRutEligible: z.boolean().optional(),
});

// ── List Invoices ──────────────────────────────────────────────────────────────

const ListQuerySchema = z.object({
  status: z.enum(INVOICE_STATUSES as unknown as [InvoiceStatus, ...InvoiceStatus[]]).optional(),
  companyId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  from: z.string().regex(DATE_ONLY).optional(),
  to: z.string().regex(DATE_ONLY).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const handleListInvoices = createHandler(
  {
    auth: 'jwt',
    tag: 'Invoices:List',
    query: ListQuerySchema,
    permission: 'invoices.read',
    rateLimit: { max: 120, windowMs: 60_000 },
  },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof ListQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const { invoices, total } = await listInvoices(payload.orgId!, {
      status: query.status,
      companyId: query.companyId,
      customerId: query.customerId,
      from: query.from,
      to: query.to,
      limit: query.limit,
      offset: query.offset,
    });
    return ok({ invoices, total, limit: query.limit, offset: query.offset });
  },
);

// ── Get Invoice ──────────────────────────────────────────────────────────────

export const handleGetInvoice = createHandler(
  {
    auth: 'jwt',
    tag: 'Invoices:Get',
    permission: 'invoices.read',
    rateLimit: { max: 120, windowMs: 60_000 },
  },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);
    const invoice = await getInvoice(id, payload.orgId!);
    if (!invoice) throw Errors.notFound('Invoice');
    return ok(invoice);
  },
);

// ── Create Invoice ─────────────────────────────────────────────────────────────

const CreateBlankSchema = z.object({
  source: z.literal('blank').optional(),
  companyId: z.string().uuid('companyId must be a valid UUID'),
  customerId: z.string().uuid().optional(),
  recipientName: z.string().min(1).max(200).optional(),
  recipientEmail: z.string().email().optional(),
  recipientCompany: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  lineItems: z.array(LineItemSchema).max(200).optional(),
});

const CreateFromOfferSchema = z.object({
  source: z.literal('offer'),
  offerId: z.string().uuid(),
  notes: z.string().max(5000).optional(),
});

const CreateFromTimeSchema = z.object({
  source: z.literal('time'),
  projectId: z.string().uuid(),
  timeEntryIds: z.array(z.string().uuid()).min(1).max(500),
  hourlyRate: z.number().min(0).optional(),
  notes: z.string().max(5000).optional(),
});

const CreateBodySchema = z.discriminatedUnion('source', [
  CreateFromOfferSchema,
  CreateFromTimeSchema,
  CreateBlankSchema.extend({ source: z.literal('blank') }),
]).or(CreateBlankSchema);

export const handleCreateInvoice = createHandler(
  {
    auth: 'jwt',
    tag: 'Invoices:Create',
    body: CreateBodySchema,
    permission: 'invoices.write',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const invoice = await createInvoice(payload.orgId!, payload.sub, body);
    return created(invoice, invoiceLocation(invoice.id));
  },
);

// ── Update Invoice (draft only) ──────────────────────────────────────────────

const UpdateBodySchema = z.object({
  companyId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  recipientName: z.string().min(1).max(200).optional(),
  recipientEmail: z.string().email().optional(),
  recipientCompany: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  issueDate: z.string().regex(DATE_ONLY).optional(),
  dueDate: z.string().regex(DATE_ONLY).optional(),
  paymentReference: z.string().max(100).optional(),
  lineItems: z.array(LineItemSchema).max(200).optional(),
});

export const handleUpdateInvoice = createHandler(
  {
    auth: 'jwt',
    tag: 'Invoices:Update',
    body: UpdateBodySchema,
    permission: 'invoices.write',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);
    const updated = await updateInvoice(id, payload.orgId!, body);
    if (!updated) throw Errors.notFound('Invoice');
    return ok(updated);
  },
);

// ── Delete Invoice (draft only) ──────────────────────────────────────────────

export const handleDeleteInvoice = createHandler(
  {
    auth: 'jwt',
    tag: 'Invoices:Delete',
    permission: 'invoices.delete',
    rateLimit: { max: 30, windowMs: 60_000 },
  },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);
    const deleted = await deleteInvoice(id, payload.orgId!);
    if (!deleted) throw Errors.notFound('Invoice');
    return ok(null);
  },
);

// ── Send / Issue Invoice ──────────────────────────────────────────────────────

export const handleSendInvoice = createHandler(
  {
    auth: 'jwt',
    tag: 'Invoices:Send',
    permission: 'invoices.send',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);
    const sent = await sendInvoice(id, payload.orgId!);
    if (!sent) throw Errors.notFound('Invoice');
    return ok(sent);
  },
);

// ── Mark Invoice Paid ─────────────────────────────────────────────────────────

const MarkPaidBodySchema = z.object({
  paidAt: z.string().regex(DATE_ONLY).optional(),
});

export const handleMarkInvoicePaid = createHandler(
  {
    auth: 'jwt',
    tag: 'Invoices:MarkPaid',
    body: MarkPaidBodySchema,
    permission: 'invoices.write',
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof MarkPaidBodySchema>; req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);
    const paid = await markInvoicePaid(id, payload.orgId!, body.paidAt);
    if (!paid) throw Errors.notFound('Invoice');
    return ok(paid);
  },
);

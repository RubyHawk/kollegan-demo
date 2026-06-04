import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { created, noContent, ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
  type Customer,
} from '../../application/customers.service';

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? req.cookies.get('token')?.value ?? '';
}

async function requireStaff(req: NextRequest) {
  const payload = await verifyToken(extractToken(req));
  if (!payload.orgId) throw Errors.forbidden('No organization context');
  if (payload.userType !== 'staff' && !payload.roles.some((r) => ['super_admin', 'admin', 'user'].includes(r))) {
    throw Errors.forbidden('Staff role required');
  }
  return payload;
}

function extractId(req: NextRequest): string {
  return req.nextUrl.pathname.split('/').at(-1) ?? '';
}

function toContactCompat(customer: Customer) {
  return {
    ...customer,
    callCount: 0,
    firstSeen: customer.createdAt,
    lastSeen: customer.updatedAt,
  };
}

const ListQuerySchema = z.object({
  search: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const handleListCustomers = createHandler(
  { auth: 'jwt', tag: 'Customers:List', query: ListQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof ListQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const result = await listCustomers(payload.orgId!, query);
    return ok({
      contacts: result.customers.map(toContactCompat),
      customers: result.customers,
      total: result.total,
      limit: query.limit,
      offset: query.offset,
    });
  },
);

const CreateBodySchema = z.object({
  companyId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  postalCode: z.string().max(30).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const handleCreateCustomer = createHandler(
  { auth: 'jwt', tag: 'Customers:Create', body: CreateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const customer = await createCustomer({ organizationId: payload.orgId!, ...body });
    return created({ customer, contact: toContactCompat(customer) });
  },
);

export const handleGetCustomer = createHandler(
  { auth: 'jwt', tag: 'Customers:Get', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await requireStaff(req);
    const customer = await getCustomer(extractId(req), payload.orgId!);
    if (!customer) throw Errors.notFound('Customer not found');
    return ok({ customer, contact: toContactCompat(customer) });
  },
);

const UpdateBodySchema = z.object({
  companyId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  postalCode: z.string().max(30).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const handleUpdateCustomer = createHandler(
  { auth: 'jwt', tag: 'Customers:Update', body: UpdateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const customer = await updateCustomer(extractId(req), payload.orgId!, body);
    if (!customer) throw Errors.notFound('Customer not found');
    return ok({ customer, contact: toContactCompat(customer) });
  },
);

export const handleDeleteCustomer = createHandler(
  { auth: 'jwt', tag: 'Customers:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await requireStaff(req);
    if (!payload.roles.some((r) => ['super_admin', 'admin'].includes(r))) throw Errors.forbidden('Admin role required');
    const deleted = await deleteCustomer(extractId(req), payload.orgId!);
    if (!deleted) throw Errors.notFound('Customer not found');
    return noContent();
  },
);

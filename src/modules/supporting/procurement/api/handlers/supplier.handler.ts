import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { created, noContent, ok } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import { createSupplier, deleteSupplier, listSuppliers, updateSupplier } from '../../application/procurement.service';

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

const ListQuerySchema = z.object({
  search: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const SupplierBodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  orgNumber: z.string().max(50).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  postalCode: z.string().max(30).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

const UpdateSupplierBodySchema = SupplierBodySchema.partial();

export const handleListSuppliers = createHandler(
  { auth: 'jwt', tag: 'Suppliers:List', query: ListQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof ListQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const result = await listSuppliers(payload.orgId!, query);
    return ok({ suppliers: result.suppliers, total: result.total, limit: query.limit, offset: query.offset });
  },
);

export const handleCreateSupplier = createHandler(
  { auth: 'jwt', tag: 'Suppliers:Create', body: SupplierBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof SupplierBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const supplier = await createSupplier({ organizationId: payload.orgId!, ...body, createdBy: payload.sub });
    return created({ supplier });
  },
);

export const handleUpdateSupplier = createHandler(
  { auth: 'jwt', tag: 'Suppliers:Update', body: UpdateSupplierBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateSupplierBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const supplier = await updateSupplier(extractId(req), payload.orgId!, body);
    if (!supplier) throw Errors.notFound('Supplier not found');
    return ok({ supplier });
  },
);

export const handleDeleteSupplier = createHandler(
  { auth: 'jwt', tag: 'Suppliers:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await requireStaff(req);
    const deleted = await deleteSupplier(extractId(req), payload.orgId!);
    if (!deleted) throw Errors.notFound('Supplier not found');
    return noContent();
  },
);

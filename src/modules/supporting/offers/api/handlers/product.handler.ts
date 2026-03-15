/**
 * Offer Product API handlers — product/service library management.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok, created } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../application/products.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

function extractId(req: NextRequest): string {
  return req.nextUrl.pathname.split('/').at(-1) ?? '';
}

async function requireStaff(req: NextRequest) {
  const payload = await verifyToken(extractToken(req));
  if (!payload.orgId) throw Errors.forbidden('No organization context');
  return payload;
}

// ── List Products ─────────────────────────────────────────────────────────────

const ListQuerySchema = z.object({
  search: z.string().max(100).optional(),
});

export const handleListProducts = createHandler(
  { auth: 'jwt', tag: 'OfferProducts:List', query: ListQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof ListQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const products = await listProducts(payload.orgId!, query.search);
    return ok({ products });
  },
);

// ── Create Product ────────────────────────────────────────────────────────────

const CreateBodySchema = z.object({
  name:        z.string().min(1).max(300),
  description: z.string().max(1000).optional(),
  unitPrice:   z.number().min(0),
  vatRate:     z.number().min(0).max(1).default(0.25),
  unit:        z.string().max(50).optional(),
});

export const handleCreateProduct = createHandler(
  { auth: 'jwt', tag: 'OfferProducts:Create', body: CreateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const product = await createProduct({
      organizationId: payload.orgId!,
      name:           body.name,
      description:    body.description,
      unitPrice:      body.unitPrice,
      vatRate:        body.vatRate,
      unit:           body.unit,
    }, payload.sub);
    return created(product, `/api/offers/products/${product.id}`);
  },
);

// ── Update Product ────────────────────────────────────────────────────────────

const UpdateBodySchema = z.object({
  name:        z.string().min(1).max(300).optional(),
  description: z.string().max(1000).optional(),
  unitPrice:   z.number().min(0).optional(),
  vatRate:     z.number().min(0).max(1).optional(),
  unit:        z.string().max(50).optional(),
});

export const handleUpdateProduct = createHandler(
  { auth: 'jwt', tag: 'OfferProducts:Update', body: UpdateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);
    const updated = await updateProduct(id, payload.orgId!, body);
    if (!updated) throw Errors.notFound('Product not found');
    return ok(updated);
  },
);

// ── Delete Product ────────────────────────────────────────────────────────────

export const handleDeleteProduct = createHandler(
  { auth: 'jwt', tag: 'OfferProducts:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id = extractId(req);
    const payload = await verifyToken(extractToken(req));
    if (!payload.orgId) throw Errors.forbidden('No organization context');
    const isAdmin = payload.roles.some((r) => ['super_admin', 'admin'].includes(r));
    if (!isAdmin) throw Errors.forbidden('Product deletion requires admin role');
    const deleted = await deleteProduct(id, payload.orgId);
    if (!deleted) throw Errors.notFound('Product not found');
    return ok(null);
  },
);

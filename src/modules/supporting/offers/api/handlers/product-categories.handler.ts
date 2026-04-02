/**
 * Product Category API handlers.
 *
 * Routes:
 *   GET    /api/offers/products/categories       → list all (flat, client builds tree)
 *   POST   /api/offers/products/categories       → create category
 *   PATCH  /api/offers/products/categories/[id]  → update category
 *   DELETE /api/offers/products/categories/[id]  → soft-delete category
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createHandler } from '@platform/api/handler';
import { ok, created } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { verifyToken } from '@platform/auth/jwt';
import {
  listProductCategoryTree,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from '../../application/product-categories.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── List ──────────────────────────────────────────────────────────────────────

export const handleListProductCategories = createHandler(
  { auth: 'jwt', tag: 'ProductCategories:List', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await requireStaff(req);
    const categories = await listProductCategoryTree(payload.orgId!);
    return ok({ categories });
  },
);

// ── Create ────────────────────────────────────────────────────────────────────

const CreateBodySchema = z.object({
  name:     z.string().min(1).max(100),
  parentId: z.string().uuid().optional().nullable(),
});

export const handleCreateProductCategory = createHandler(
  { auth: 'jwt', tag: 'ProductCategories:Create', body: CreateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const cat = await createProductCategory({
      organizationId: payload.orgId!,
      name:           body.name,
      parentId:       body.parentId ?? null,
    });
    return created(cat, `/api/offers/products/categories/${cat.id}`);
  },
);

// ── Update ────────────────────────────────────────────────────────────────────

const UpdateBodySchema = z.object({
  name:     z.string().min(1).max(100).optional(),
  parentId: z.string().uuid().optional().nullable(),
});

export const handleUpdateProductCategory = createHandler(
  { auth: 'jwt', tag: 'ProductCategories:Update', body: UpdateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);
    const updated = await updateProductCategory(id, payload.orgId!, body);
    if (!updated) throw Errors.notFound('Category not found');
    return ok(updated);
  },
);

// ── Delete ────────────────────────────────────────────────────────────────────

export const handleDeleteProductCategory = createHandler(
  { auth: 'jwt', tag: 'ProductCategories:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);
    const deleted = await deleteProductCategory(id, payload.orgId!);
    if (!deleted) throw Errors.notFound('Category not found');
    return ok(null);
  },
);

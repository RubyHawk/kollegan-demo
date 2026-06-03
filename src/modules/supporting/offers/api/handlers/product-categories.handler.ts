/**
 * Product Category API handlers.
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
import { validateCompanyInOrg } from '../../application/company-validation';
import { productCategoryLocation } from './resource-location';

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

function translateCategoryError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);

  if (message === 'CATEGORY_SCHEMA_UNAVAILABLE') {
    throw Errors.unavailable('Produktkategorier är inte tillgängliga förrän databasen har uppdaterats.');
  }

  if (message === 'PARENT_NOT_FOUND') {
    throw Errors.notFound('Parent category');
  }

  if (message === 'PARENT_NOT_MAIN') {
    throw Errors.conflict('En underkategori kan bara kopplas till en huvudkategori.');
  }

  if (message === 'CATEGORY_EXISTS') {
    throw Errors.conflict('Det finns redan en kategori med samma namn på den här nivån.');
  }

  if (message === 'CATEGORY_HAS_CHILDREN') {
    throw Errors.conflict('Ta bort eller flytta underkategorierna innan du raderar huvudkategorin.');
  }

  throw error instanceof Error ? error : Errors.internal();
}

export const handleListProductCategories = createHandler(
  {
    auth: 'jwt',
    tag: 'ProductCategories:List',
    query: z.object({ companyId: z.string().uuid().optional() }),
    rateLimit: { max: 120, windowMs: 60_000 },
  },
  async (ctx) => {
    const { req, query } = ctx as { req: NextRequest; query: { companyId?: string } };
    const payload = await requireStaff(req);
    const categories = await listProductCategoryTree(payload.orgId!, query.companyId);
    return ok({ categories });
  },
);

const CreateBodySchema = z.object({
  companyId: z.string().uuid('companyId must be a valid UUID'),
  name: z.string().trim().min(1).max(100),
  parentId: z.string().uuid().optional().nullable(),
});

export const handleCreateProductCategory = createHandler(
  { auth: 'jwt', tag: 'ProductCategories:Create', body: CreateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    await validateCompanyInOrg(body.companyId, payload.orgId!);

    try {
      const category = await createProductCategory({
        organizationId: payload.orgId!,
        companyId: body.companyId,
        name: body.name,
        parentId: body.parentId ?? null,
      });
      return created(category, productCategoryLocation(category.id));
    } catch (error) {
      translateCategoryError(error);
    }
  },
);

const UpdateBodySchema = z.object({
  companyId: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1).max(100).optional(),
  parentId: z.string().uuid().optional().nullable(),
});

export const handleUpdateProductCategory = createHandler(
  { auth: 'jwt', tag: 'ProductCategories:Update', body: UpdateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);

    try {
      const updated = await updateProductCategory(id, payload.orgId!, {
        ...body,
        companyId: body.companyId ?? undefined,
      });
      if (!updated) throw Errors.notFound('Category not found');
      return ok(updated);
    } catch (error) {
      translateCategoryError(error);
    }
  },
);

export const handleDeleteProductCategory = createHandler(
  { auth: 'jwt', tag: 'ProductCategories:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);

    try {
      const deleted = await deleteProductCategory(id, payload.orgId!);
      if (!deleted) throw Errors.notFound('Category not found');
      return ok(null);
    } catch (error) {
      translateCategoryError(error);
    }
  },
);

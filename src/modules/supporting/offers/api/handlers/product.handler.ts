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
  listProductCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from '../../application/products.service';

function extractToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7) ?? req.cookies.get('at')?.value ?? '';
}

function extractId(req: NextRequest): string {
  return req.nextUrl.pathname.split('/').at(-1) ?? '';
}

async function requireStaff(req: NextRequest) {
  const payload = await verifyToken(extractToken(req));
  if (!payload.orgId) {
    throw Errors.forbidden('No organization context');
  }
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

const ListQuerySchema = z.object({
  search: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export const handleListProducts = createHandler(
  { auth: 'jwt', tag: 'OfferProducts:List', query: ListQuerySchema, rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { query, req } = ctx as { query: z.infer<typeof ListQuerySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const isActive = query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined;
    const products = await listProducts(payload.orgId!, query.search, query.category, isActive);
    return ok({ products });
  },
);

const CategoryBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  parentId: z.string().uuid().optional().nullable(),
});

const UpdateCategoryBodySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  parentId: z.string().uuid().optional().nullable(),
});

export const handleListProductCategories = createHandler(
  { auth: 'jwt', tag: 'OfferProducts:ListCategories', rateLimit: { max: 120, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await requireStaff(req);
    const categories = await listProductCategories(payload.orgId!);
    return ok({ categories });
  },
);

export const handleCreateProductCategory = createHandler(
  { auth: 'jwt', tag: 'OfferProducts:CreateCategory', body: CategoryBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CategoryBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);

    try {
      const category = await createProductCategory(
        {
          organizationId: payload.orgId!,
          name: body.name,
          parentId: body.parentId ?? undefined,
        },
        payload.sub,
      );
      return created(category, `/api/offers/products/categories/${category.id}`);
    } catch (error) {
      translateCategoryError(error);
    }
  },
);

export const handleUpdateProductCategory = createHandler(
  { auth: 'jwt', tag: 'OfferProducts:UpdateCategory', body: UpdateCategoryBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateCategoryBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const id = extractId(req);

    try {
      const updated = await updateProductCategory(id, payload.orgId!, {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.parentId !== undefined ? { parentId: body.parentId } : {}),
      });

      if (!updated) {
        throw Errors.notFound('Product category');
      }

      return ok(updated);
    } catch (error) {
      translateCategoryError(error);
    }
  },
);

export const handleDeleteProductCategory = createHandler(
  { auth: 'jwt', tag: 'OfferProducts:DeleteCategory', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const payload = await requireStaff(req);
    const id = extractId(req);

    try {
      const deleted = await deleteProductCategory(id, payload.orgId!);
      if (!deleted) {
        throw Errors.notFound('Product category');
      }
      return ok(null);
    } catch (error) {
      translateCategoryError(error);
    }
  },
);

const CreateBodySchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(1000).optional(),
  unitPrice: z.number().min(0),
  vatRate: z.number().min(0).max(1).default(0.25),
  unit: z.string().max(50).optional(),
  sku: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().max(2000).optional(),
  isActive: z.boolean().default(true),
  minQuantity: z.number().min(0).optional(),
  maxQuantity: z.number().min(0).optional(),
});

export const handleCreateProduct = createHandler(
  { auth: 'jwt', tag: 'OfferProducts:Create', body: CreateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof CreateBodySchema>; req: NextRequest };
    const payload = await requireStaff(req);
    const product = await createProduct({
      organizationId: payload.orgId!,
      name: body.name,
      description: body.description,
      unitPrice: body.unitPrice,
      vatRate: body.vatRate,
      unit: body.unit,
      sku: body.sku,
      category: body.category,
      categoryId: body.categoryId ?? undefined,
      imageUrl: body.imageUrl,
      isActive: body.isActive,
      minQuantity: body.minQuantity,
      maxQuantity: body.maxQuantity,
    }, payload.sub);
    return created(product, `/api/offers/products/${product.id}`);
  },
);

const UpdateBodySchema = z.object({
  name: z.string().min(1).max(300).optional(),
  description: z.string().max(1000).optional(),
  unitPrice: z.number().min(0).optional(),
  vatRate: z.number().min(0).max(1).optional(),
  unit: z.string().max(50).optional(),
  sku: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
  minQuantity: z.number().min(0).optional().nullable(),
  maxQuantity: z.number().min(0).optional().nullable(),
});

export const handleUpdateProduct = createHandler(
  { auth: 'jwt', tag: 'OfferProducts:Update', body: UpdateBodySchema, rateLimit: { max: 60, windowMs: 60_000 } },
  async (ctx) => {
    const { body, req } = ctx as { body: z.infer<typeof UpdateBodySchema>; req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);
    const updated = await updateProduct(id, payload.orgId!, {
      ...body,
      categoryId: body.categoryId ?? undefined,
      imageUrl: body.imageUrl ?? undefined,
      minQuantity: body.minQuantity ?? undefined,
      maxQuantity: body.maxQuantity ?? undefined,
    });
    if (!updated) {
      throw Errors.notFound('Product');
    }
    return ok(updated);
  },
);

export const handleDeleteProduct = createHandler(
  { auth: 'jwt', tag: 'OfferProducts:Delete', rateLimit: { max: 30, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const id = extractId(req);
    const payload = await requireStaff(req);
    const deleted = await deleteProduct(id, payload.orgId!);
    if (!deleted) {
      throw Errors.notFound('Product');
    }
    return ok(null);
  },
);

import { prisma } from '@platform/database/prisma';
import type { OfferProduct } from '../domain/offer.entity';
import {
  buildStructuredCategoryLabel,
  isMissingProductCategorySchemaError,
} from './product-categories.shared';

export interface CreateProductInput {
  organizationId: string;
  name: string;
  description?: string;
  unitPrice: number;
  vatRate?: number;
  unit?: string;
  sku?: string;
  category?: string;
  categoryId?: string;
  imageUrl?: string;
  isActive?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  createdBy: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  unitPrice?: number;
  vatRate?: number;
  unit?: string;
  sku?: string;
  category?: string;
  categoryId?: string | null;
  imageUrl?: string;
  isActive?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
}

type ProductCategoryRelation = {
  id: string;
  name: string;
  parentId: string | null;
  parent: { name: string } | null;
} | null;

type ProductRow = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  unitPrice: number;
  vatRate: number;
  unit: string | null;
  sku: string | null;
  category: string | null;
  categoryId: string | null;
  imageUrl: string | null;
  isActive: boolean;
  minQuantity: number | null;
  maxQuantity: number | null;
  createdBy: string;
  createdAt: Date;
  categoryNode?: ProductCategoryRelation;
};

function mapProduct(row: ProductRow): OfferProduct {
  const relation = row.categoryNode ?? null;
  const categoryLabel = relation ? buildStructuredCategoryLabel(relation) : row.category ?? undefined;

  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    description: row.description ?? undefined,
    unitPrice: row.unitPrice,
    vatRate: row.vatRate,
    unit: row.unit ?? undefined,
    sku: row.sku ?? undefined,
    category: categoryLabel,
    categoryId: relation?.id ?? row.categoryId ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    isActive: row.isActive ?? true,
    minQuantity: row.minQuantity ?? undefined,
    maxQuantity: row.maxQuantity ?? undefined,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
  };
}

const PRODUCT_SELECT = {
  id: true,
  organizationId: true,
  name: true,
  description: true,
  unitPrice: true,
  vatRate: true,
  unit: true,
  sku: true,
  category: true,
  categoryId: true,
  imageUrl: true,
  isActive: true,
  minQuantity: true,
  maxQuantity: true,
  createdBy: true,
  createdAt: true,
  categoryNode: {
    select: {
      id: true,
      name: true,
      parentId: true,
      parent: {
        select: {
          name: true,
        },
      },
    },
  },
};

const LEGACY_PRODUCT_SELECT = {
  id: true,
  organizationId: true,
  name: true,
  description: true,
  unitPrice: true,
  vatRate: true,
  unit: true,
  sku: true,
  category: true,
  imageUrl: true,
  isActive: true,
  minQuantity: true,
  maxQuantity: true,
  createdBy: true,
  createdAt: true,
};

async function resolveCategorySelection(
  organizationId: string,
  categoryId?: string | null,
  categoryLabel?: string,
): Promise<{ categoryId: string | null; category: string | null }> {
  if (!categoryId) {
    return { categoryId: null, category: categoryLabel?.trim() || null };
  }

  try {
    const category = await prisma.productCategory.findFirst({
      where: {
        id: categoryId,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        parent: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!category) {
      return { categoryId: null, category: categoryLabel?.trim() || null };
    }

    return {
      categoryId: category.id,
      category: buildStructuredCategoryLabel(category),
    };
  } catch (error) {
    if (isMissingProductCategorySchemaError(error)) {
      return { categoryId: null, category: categoryLabel?.trim() || null };
    }
    throw error;
  }
}

export const productsRepository = {
  async list(orgId: string, search?: string, category?: string, isActive?: boolean): Promise<OfferProduct[]> {
    const where = {
      organizationId: orgId,
      deletedAt: null,
      ...(isActive !== undefined ? { isActive } : {}),
      ...(category ? { category } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    try {
      const rows = await prisma.offerProduct.findMany({
        where,
        select: PRODUCT_SELECT,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });

      return rows.map((row) => mapProduct(row as ProductRow));
    } catch (error) {
      if (!isMissingProductCategorySchemaError(error)) {
        throw error;
      }

      const rows = await prisma.offerProduct.findMany({
        where,
        select: LEGACY_PRODUCT_SELECT,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });

      return rows.map((row) =>
        mapProduct({
          ...(row as Omit<ProductRow, 'categoryId' | 'categoryNode'>),
          categoryId: null,
          categoryNode: null,
        }),
      );
    }
  },

  async listCategories(orgId: string): Promise<string[]> {
    const rows = await prisma.offerProduct.findMany({
      where: { organizationId: orgId, deletedAt: null, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return rows.map((row) => row.category as string).filter(Boolean);
  },

  async create(input: CreateProductInput): Promise<OfferProduct> {
    const categorySelection = await resolveCategorySelection(
      input.organizationId,
      input.categoryId,
      input.category,
    );

    try {
      const row = await prisma.offerProduct.create({
        data: {
          organizationId: input.organizationId,
          name: input.name,
          description: input.description ?? null,
          unitPrice: input.unitPrice,
          vatRate: input.vatRate ?? 0.25,
          unit: input.unit ?? null,
          sku: input.sku ?? null,
          category: categorySelection.category,
          categoryId: categorySelection.categoryId,
          imageUrl: input.imageUrl ?? null,
          isActive: input.isActive ?? true,
          minQuantity: input.minQuantity ?? null,
          maxQuantity: input.maxQuantity ?? null,
          createdBy: input.createdBy,
        },
        select: PRODUCT_SELECT,
      });

      return mapProduct(row as ProductRow);
    } catch (error) {
      if (!isMissingProductCategorySchemaError(error)) {
        throw error;
      }

      const row = await prisma.offerProduct.create({
        data: {
          organizationId: input.organizationId,
          name: input.name,
          description: input.description ?? null,
          unitPrice: input.unitPrice,
          vatRate: input.vatRate ?? 0.25,
          unit: input.unit ?? null,
          sku: input.sku ?? null,
          category: categorySelection.category,
          imageUrl: input.imageUrl ?? null,
          isActive: input.isActive ?? true,
          minQuantity: input.minQuantity ?? null,
          maxQuantity: input.maxQuantity ?? null,
          createdBy: input.createdBy,
        },
        select: LEGACY_PRODUCT_SELECT,
      });

      return mapProduct({
        ...(row as Omit<ProductRow, 'categoryId' | 'categoryNode'>),
        categoryId: null,
        categoryNode: null,
      });
    }
  },

  async update(id: string, orgId: string, input: UpdateProductInput): Promise<OfferProduct | null> {
    const existing = await prisma.offerProduct.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    const categorySelection =
      input.categoryId !== undefined || input.category !== undefined
        ? await resolveCategorySelection(orgId, input.categoryId, input.category)
        : null;

    const data = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.unitPrice !== undefined ? { unitPrice: input.unitPrice } : {}),
      ...(input.vatRate !== undefined ? { vatRate: input.vatRate } : {}),
      ...(input.unit !== undefined ? { unit: input.unit } : {}),
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(categorySelection ? { category: categorySelection.category, categoryId: categorySelection.categoryId } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.minQuantity !== undefined ? { minQuantity: input.minQuantity } : {}),
      ...(input.maxQuantity !== undefined ? { maxQuantity: input.maxQuantity } : {}),
    };

    try {
      const row = await prisma.offerProduct.update({
        where: { id },
        data,
        select: PRODUCT_SELECT,
      });

      return mapProduct(row as ProductRow);
    } catch (error) {
      if (!isMissingProductCategorySchemaError(error)) {
        throw error;
      }

      const legacyData = Object.fromEntries(
        Object.entries(data).filter(([key]) => key !== 'categoryId'),
      );
      const row = await prisma.offerProduct.update({
        where: { id },
        data: legacyData,
        select: LEGACY_PRODUCT_SELECT,
      });

      return mapProduct({
        ...(row as Omit<ProductRow, 'categoryId' | 'categoryNode'>),
        categoryId: null,
        categoryNode: null,
      });
    }
  },

  async delete(id: string, orgId: string): Promise<boolean> {
    const existing = await prisma.offerProduct.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await prisma.offerProduct.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  },
};

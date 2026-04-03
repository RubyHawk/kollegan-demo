import { prisma } from '@platform/database/prisma';
import type { ProductCategory } from '../domain/offer.entity';
import {
  buildStructuredCategoryLabel,
  isMissingProductCategorySchemaError,
} from './product-categories.shared';

type ProductCategoryRow = {
  id: string;
  organizationId: string;
  name: string;
  parentId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface CreateProductCategoryInput {
  organizationId: string;
  name: string;
  parentId?: string;
  createdBy: string;
}

export interface UpdateProductCategoryInput {
  name?: string;
  parentId?: string | null;
}

function mapCategory(row: ProductCategoryRow): ProductCategory {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    parentId: row.parentId ?? undefined,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function ensureParentIsMainCategory(organizationId: string, parentId: string) {
  const parent = await prisma.productCategory.findFirst({
    where: { id: parentId, organizationId, deletedAt: null },
    select: { id: true, parentId: true },
  });

  if (!parent) {
    throw new Error('PARENT_NOT_FOUND');
  }

  if (parent.parentId) {
    throw new Error('PARENT_NOT_MAIN');
  }
}

export const productCategoriesRepository = {
  async list(organizationId: string): Promise<ProductCategory[]> {
    try {
      const rows = await prisma.productCategory.findMany({
        where: { organizationId, deletedAt: null },
        select: {
          id: true,
          organizationId: true,
          name: true,
          parentId: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      });

      return rows.map((row) => mapCategory(row));
    } catch (error) {
      if (isMissingProductCategorySchemaError(error)) {
        return [];
      }
      throw error;
    }
  },

  async create(input: CreateProductCategoryInput): Promise<ProductCategory> {
    try {
      const name = input.name.trim();
      if (input.parentId) {
        await ensureParentIsMainCategory(input.organizationId, input.parentId);
      }

      const duplicate = await prisma.productCategory.findFirst({
        where: {
          organizationId: input.organizationId,
          parentId: input.parentId ?? null,
          deletedAt: null,
          name: { equals: name, mode: 'insensitive' },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new Error('CATEGORY_EXISTS');
      }

      const row = await prisma.productCategory.create({
        data: {
          organizationId: input.organizationId,
          name,
          parentId: input.parentId ?? null,
          createdBy: input.createdBy,
        },
        select: {
          id: true,
          organizationId: true,
          name: true,
          parentId: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return mapCategory(row);
    } catch (error) {
      if (isMissingProductCategorySchemaError(error)) {
        throw new Error('CATEGORY_SCHEMA_UNAVAILABLE');
      }
      throw error;
    }
  },

  async update(id: string, organizationId: string, input: UpdateProductCategoryInput): Promise<ProductCategory | null> {
    try {
      const existing = await prisma.productCategory.findFirst({
        where: { id, organizationId, deletedAt: null },
        select: { id: true, parentId: true },
      });

      if (!existing) {
        return null;
      }

      if (input.parentId && input.parentId !== existing.parentId) {
        await ensureParentIsMainCategory(organizationId, input.parentId);
      }

      const row = await prisma.productCategory.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
        },
        select: {
          id: true,
          organizationId: true,
          name: true,
          parentId: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return mapCategory(row);
    } catch (error) {
      if (isMissingProductCategorySchemaError(error)) {
        throw new Error('CATEGORY_SCHEMA_UNAVAILABLE');
      }
      throw error;
    }
  },

  async delete(id: string, organizationId: string): Promise<boolean> {
    try {
      const existing = await prisma.productCategory.findFirst({
        where: { id, organizationId, deletedAt: null },
        select: {
          id: true,
          name: true,
          parentId: true,
          parent: { select: { name: true } },
          children: {
            where: { deletedAt: null },
            select: { id: true },
            take: 1,
          },
        },
      });

      if (!existing) {
        return false;
      }

      if (!existing.parentId && existing.children.length > 0) {
        throw new Error('CATEGORY_HAS_CHILDREN');
      }

      const fallbackLabel = buildStructuredCategoryLabel({
        name: existing.name,
        parent: existing.parent,
      });

      await prisma.$transaction([
        prisma.offerProduct.updateMany({
          where: { organizationId, categoryId: id, deletedAt: null },
          data: {
            categoryId: null,
            category: fallbackLabel,
          },
        }),
        prisma.productCategory.update({
          where: { id },
          data: { deletedAt: new Date() },
        }),
      ]);

      return true;
    } catch (error) {
      if (isMissingProductCategorySchemaError(error)) {
        throw new Error('CATEGORY_SCHEMA_UNAVAILABLE');
      }
      throw error;
    }
  },
};

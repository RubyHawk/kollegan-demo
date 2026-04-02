import { Errors } from '@platform/api/errors';
import { Prisma, prisma } from '@platform/database/prisma';
import type { ProductCategory } from '../domain/offer.entity';

export interface CreateCategoryInput {
  organizationId: string;
  name: string;
  parentId?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  parentId?: string | null;
}

function mapCategory(r: Record<string, unknown>): ProductCategory {
  return {
    id: r.id as string,
    organizationId: r.organizationId as string,
    name: r.name as string,
    parentId: (r.parentId as string | null) ?? null,
    createdAt: (r.createdAt as Date).toISOString(),
    updatedAt: (r.updatedAt as Date).toISOString(),
  };
}

const CAT_SELECT = {
  id: true,
  organizationId: true,
  name: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductCategorySelect;

function getPrismaErrorText(error: Prisma.PrismaClientKnownRequestError) {
  const meta = error.meta ? JSON.stringify(error.meta).toLowerCase() : '';
  return `${error.message.toLowerCase()} ${meta}`;
}

function isMissingCategoriesTable(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== 'P2021') return false;
  return getPrismaErrorText(error).includes('productcategory');
}

function isMissingProductCategoryColumn(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== 'P2022') return false;
  return getPrismaErrorText(error).includes('categoryid');
}

function throwUnavailable(): never {
  throw Errors.unavailable('Produktkategorier kräver en nyare databasstruktur. Kör senaste migrationerna och försök igen.');
}

export const productCategoriesRepository = {
  async list(orgId: string): Promise<ProductCategory[]> {
    try {
      const rows = await prisma.productCategory.findMany({
        where: { organizationId: orgId, deletedAt: null },
        select: CAT_SELECT,
        orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      });
      return rows.map((row) => mapCategory(row as unknown as Record<string, unknown>));
    } catch (error) {
      if (!isMissingCategoriesTable(error)) throw error;
      return [];
    }
  },

  async findById(id: string, orgId: string): Promise<ProductCategory | null> {
    try {
      const row = await prisma.productCategory.findFirst({
        where: { id, organizationId: orgId, deletedAt: null },
        select: CAT_SELECT,
      });
      return row ? mapCategory(row as unknown as Record<string, unknown>) : null;
    } catch (error) {
      if (!isMissingCategoriesTable(error)) throw error;
      return null;
    }
  },

  async create(input: CreateCategoryInput): Promise<ProductCategory> {
    try {
      const row = await prisma.productCategory.create({
        data: {
          organizationId: input.organizationId,
          name: input.name,
          parentId: input.parentId ?? null,
        },
        select: CAT_SELECT,
      });
      return mapCategory(row as unknown as Record<string, unknown>);
    } catch (error) {
      if (!isMissingCategoriesTable(error)) throw error;
      throwUnavailable();
    }
  },

  async update(id: string, orgId: string, input: UpdateCategoryInput): Promise<ProductCategory | null> {
    try {
      const existing = await prisma.productCategory.findFirst({
        where: { id, organizationId: orgId, deletedAt: null },
      });
      if (!existing) return null;
      const row = await prisma.productCategory.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
        },
        select: CAT_SELECT,
      });
      return mapCategory(row as unknown as Record<string, unknown>);
    } catch (error) {
      if (!isMissingCategoriesTable(error)) throw error;
      throwUnavailable();
    }
  },

  async delete(id: string, orgId: string): Promise<boolean> {
    try {
      const existing = await prisma.productCategory.findFirst({
        where: { id, organizationId: orgId, deletedAt: null },
      });
      if (!existing) return false;

      await prisma.productCategory.updateMany({
        where: { parentId: id, organizationId: orgId, deletedAt: null },
        data: { parentId: null },
      });

      try {
        await prisma.offerProduct.updateMany({
          where: { categoryId: id, organizationId: orgId, deletedAt: null },
          data: { categoryId: null },
        });
      } catch (error) {
        if (!isMissingProductCategoryColumn(error)) throw error;
      }

      await prisma.productCategory.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch (error) {
      if (!isMissingCategoriesTable(error)) throw error;
      throwUnavailable();
    }
  },
};

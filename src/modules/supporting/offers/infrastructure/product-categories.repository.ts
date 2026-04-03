import { randomUUID } from 'node:crypto';
import { Prisma, prisma } from '@platform/database/prisma';
import type { ProductCategory } from '../domain/offer.entity';
import {
  buildStructuredCategoryLabel,
  isMissingProductCategorySchemaError,
} from './product-categories.shared';

export interface CreateCategoryInput {
  organizationId: string;
  companyId?: string | null;
  name: string;
  parentId?: string | null;
}

export interface UpdateCategoryInput {
  companyId?: string | null;
  name?: string;
  parentId?: string | null;
}

type CategoryRow = {
  id: string;
  organizationId: string;
  companyId?: string | null;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapCategory(row: CategoryRow): ProductCategory {
  return {
    id: row.id,
    organizationId: row.organizationId,
    companyId: row.companyId ?? undefined,
    name: row.name,
    parentId: row.parentId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const CATEGORY_SELECT = {
  id: true,
  organizationId: true,
  companyId: true,
  name: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductCategorySelect;

type CategorySelection = {
  id: string;
  name: string;
  parentId: string | null;
  parent: { name: string } | null;
};

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function isLegacyCreatedByConstraintError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== 'P2011') return false;
  const meta = error.meta ? JSON.stringify(error.meta).toLowerCase() : '';
  return `${error.message.toLowerCase()} ${meta}`.includes('createdby');
}

function isMissingProductCategoryIdColumn(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== 'P2022') return false;
  const meta = error.meta ? JSON.stringify(error.meta).toLowerCase() : '';
  return `${error.message.toLowerCase()} ${meta}`.includes('categoryid');
}

async function getCategorySelection(id: string, organizationId: string, companyId?: string | null): Promise<CategorySelection | null> {
  const category = await prisma.productCategory.findFirst({
    where: {
      id,
      organizationId,
      deletedAt: null,
      ...(companyId ? { OR: [{ companyId }, { companyId: null }] } : {}),
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

  return category as CategorySelection | null;
}

async function ensureParentIsMainCategory(organizationId: string, parentId: string, companyId?: string | null) {
  const parent = await prisma.productCategory.findFirst({
    where: {
      id: parentId,
      organizationId,
      deletedAt: null,
      ...(companyId ? { OR: [{ companyId }, { companyId: null }] } : {}),
    },
    select: { id: true, parentId: true },
  });

  if (!parent) {
    throw new Error('PARENT_NOT_FOUND');
  }

  if (parent.parentId) {
    throw new Error('PARENT_NOT_MAIN');
  }
}

function normalizeName(name: string) {
  return name.trim();
}

export const productCategoriesRepository = {
  async list(orgId: string, companyId?: string): Promise<ProductCategory[]> {
    try {
      const rows = await prisma.productCategory.findMany({
        where: {
          organizationId: orgId,
          deletedAt: null,
          ...(companyId ? { OR: [{ companyId }, { companyId: null }] } : {}),
        },
        select: CATEGORY_SELECT,
        orderBy: [{ companyId: 'desc' }, { parentId: 'asc' }, { name: 'asc' }],
      });
      return rows.map((row) => ({
        ...mapCategory(row as CategoryRow),
        companyId: (row as CategoryRow & { companyId?: string | null }).companyId ?? undefined,
      }));
    } catch (error) {
      if (isMissingProductCategorySchemaError(error)) {
        return [];
      }
      throw error;
    }
  },

  async create(input: CreateCategoryInput): Promise<ProductCategory> {
    try {
      const name = normalizeName(input.name);
      if (input.parentId) {
        await ensureParentIsMainCategory(input.organizationId, input.parentId, input.companyId);
      }

      const row = await prisma.productCategory.create({
        data: {
          organizationId: input.organizationId,
          companyId: input.companyId ?? null,
          name,
          parentId: input.parentId ?? null,
        },
        select: CATEGORY_SELECT,
      });

      return {
        ...mapCategory(row as CategoryRow),
        companyId: (((row as unknown) as Record<string, unknown>).companyId as string | null) ?? undefined,
      };
    } catch (error) {
      if (isLegacyCreatedByConstraintError(error)) {
        const id = randomUUID();
        const name = normalizeName(input.name);

        await prisma.$executeRaw`
          INSERT INTO "off_product_categories" ("id", "organizationId", "companyId", "name", "parentId", "createdBy", "createdAt", "updatedAt")
          VALUES (${id}, ${input.organizationId}, ${input.companyId ?? null}, ${name}, ${input.parentId ?? null}, ${'system'}, NOW(), NOW())
        `;

        const fallbackRow = await prisma.productCategory.findFirst({
          where: { id, organizationId: input.organizationId, deletedAt: null },
          select: CATEGORY_SELECT,
        });

        if (!fallbackRow) {
          throw new Error('CATEGORY_SCHEMA_UNAVAILABLE');
        }

        return {
          ...mapCategory(fallbackRow as CategoryRow),
          companyId: (((fallbackRow as unknown) as Record<string, unknown>).companyId as string | null) ?? undefined,
        };
      }
      if (isUniqueConstraintError(error)) {
        throw new Error('CATEGORY_EXISTS');
      }
      if (isMissingProductCategorySchemaError(error)) {
        throw new Error('CATEGORY_SCHEMA_UNAVAILABLE');
      }
      throw error;
    }
  },

  async update(id: string, orgId: string, input: UpdateCategoryInput): Promise<ProductCategory | null> {
    try {
      const existing = await prisma.productCategory.findFirst({
        where: {
          id,
          organizationId: orgId,
          deletedAt: null,
          ...(input.companyId ? { OR: [{ companyId: input.companyId }, { companyId: null }] } : {}),
        },
        select: { id: true, parentId: true },
      });
      if (!existing) return null;

      if (input.parentId === id) {
        throw new Error('PARENT_NOT_MAIN');
      }

      if (input.parentId && input.parentId !== existing.parentId) {
        await ensureParentIsMainCategory(orgId, input.parentId, input.companyId);
      }

      const row = await prisma.productCategory.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: normalizeName(input.name) } : {}),
          ...(input.companyId !== undefined ? { companyId: input.companyId ?? null } : {}),
          ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
        },
        select: CATEGORY_SELECT,
      });

      return {
        ...mapCategory(row as CategoryRow),
        companyId: (((row as unknown) as Record<string, unknown>).companyId as string | null) ?? undefined,
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error('CATEGORY_EXISTS');
      }
      if (isMissingProductCategorySchemaError(error)) {
        throw new Error('CATEGORY_SCHEMA_UNAVAILABLE');
      }
      throw error;
    }
  },

  async delete(id: string, orgId: string): Promise<boolean> {
    try {
      const existing = await prisma.productCategory.findFirst({
        where: { id, organizationId: orgId, deletedAt: null },
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
      if (!existing) return false;

      if (!existing.parentId && existing.children.length > 0) {
        throw new Error('CATEGORY_HAS_CHILDREN');
      }

      const fallbackLabel = buildStructuredCategoryLabel({
        name: existing.name,
        parent: existing.parent,
      });

      const operations: Prisma.PrismaPromise<unknown>[] = [
        prisma.productCategory.update({
          where: { id },
          data: { deletedAt: new Date() },
        }),
      ];

      try {
        operations.unshift(
          prisma.offerProduct.updateMany({
            where: { categoryId: id, organizationId: orgId, deletedAt: null },
            data: {
              categoryId: null,
              category: fallbackLabel,
            },
          }),
        );
      } catch (error) {
        if (!isMissingProductCategoryIdColumn(error)) {
          throw error;
        }
      }

      await prisma.$transaction(operations);
      return true;
    } catch (error) {
      if (isMissingProductCategorySchemaError(error)) {
        throw new Error('CATEGORY_SCHEMA_UNAVAILABLE');
      }
      throw error;
    }
  },

  async getResolvedLabel(organizationId: string, categoryId?: string | null, categoryLabel?: string | null, companyId?: string | null) {
    if (!categoryId) {
      return {
        categoryId: null,
        category: categoryLabel?.trim() || null,
      };
    }

    try {
      const category = await getCategorySelection(categoryId, organizationId, companyId);
      if (!category) {
        return {
          categoryId: null,
          category: categoryLabel?.trim() || null,
        };
      }

      return {
        categoryId: category.id,
        category: buildStructuredCategoryLabel(category),
      };
    } catch (error) {
      if (isMissingProductCategorySchemaError(error)) {
        return {
          categoryId: null,
          category: categoryLabel?.trim() || null,
        };
      }
      throw error;
    }
  },
};

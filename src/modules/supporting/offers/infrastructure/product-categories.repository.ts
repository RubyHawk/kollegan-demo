import { prisma } from '@platform/database/prisma';
import type { ProductCategory } from '../domain/offer.entity';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CreateCategoryInput {
  organizationId: string;
  name:           string;
  parentId?:      string | null;
}

export interface UpdateCategoryInput {
  name?:     string;
  parentId?: string | null;
}

// ─── Mapper ────────────────────────────────────────────────────────────────────

function mapCategory(r: Record<string, unknown>): ProductCategory {
  return {
    id:             r.id as string,
    organizationId: r.organizationId as string,
    name:           r.name as string,
    parentId:       (r.parentId as string | null) ?? null,
    createdAt:      (r.createdAt as Date).toISOString(),
    updatedAt:      (r.updatedAt as Date).toISOString(),
  };
}

const CAT_SELECT = {
  id: true, organizationId: true, name: true, parentId: true, createdAt: true, updatedAt: true,
};

// ─── Repository ────────────────────────────────────────────────────────────────

export const productCategoriesRepository = {

  /** Returns all non-deleted categories for an org, flat list. */
  async list(orgId: string): Promise<ProductCategory[]> {
    const rows = await prisma.productCategory.findMany({
      where: { organizationId: orgId, deletedAt: null },
      select: CAT_SELECT,
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });
    return rows.map((r: unknown) => mapCategory(r as Record<string, unknown>));
  },

  async findById(id: string, orgId: string): Promise<ProductCategory | null> {
    const row = await prisma.productCategory.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: CAT_SELECT,
    });
    return row ? mapCategory(row as unknown as Record<string, unknown>) : null;
  },

  async create(input: CreateCategoryInput): Promise<ProductCategory> {
    const row = await prisma.productCategory.create({
      data: {
        organizationId: input.organizationId,
        name:           input.name,
        parentId:       input.parentId ?? null,
      },
      select: CAT_SELECT,
    });
    return mapCategory(row as unknown as Record<string, unknown>);
  },

  async update(id: string, orgId: string, input: UpdateCategoryInput): Promise<ProductCategory | null> {
    const existing = await prisma.productCategory.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!existing) return null;
    const row = await prisma.productCategory.update({
      where: { id },
      data: {
        ...(input.name     !== undefined ? { name:     input.name }     : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      },
      select: CAT_SELECT,
    });
    return mapCategory(row as unknown as Record<string, unknown>);
  },

  /** Soft-delete. Unlinks products (sets their categoryId to null) before deleting. */
  async delete(id: string, orgId: string): Promise<boolean> {
    const existing = await prisma.productCategory.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!existing) return false;

    // Re-parent any subcategories to null (promote to top-level)
    await prisma.productCategory.updateMany({
      where: { parentId: id, organizationId: orgId, deletedAt: null },
      data: { parentId: null },
    });

    // Unlink products from this category
    await prisma.offerProduct.updateMany({
      where: { categoryId: id, organizationId: orgId, deletedAt: null },
      data: { categoryId: null },
    });

    await prisma.productCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return true;
  },
};

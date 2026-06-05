import { Prisma, prisma } from '@platform/database/prisma';
import type { OfferProduct } from '../domain/offer.entity';
import {
  buildStructuredCategoryLabel,
  isMissingProductCategorySchemaError,
} from './product-categories.shared';
import { productCategoriesRepository } from './product-categories.repository';

export interface CreateProductInput {
  organizationId: string;
  companyId?: string | null;
  name: string;
  description?: string;
  unitPrice: number;
  vatRate?: number;
  unit?: string;
  sku?: string;
  category?: string;
  categoryId?: string | null;
  imageUrl?: string;
  isActive?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  customFields?: Record<string, unknown>;
  createdBy: string;
}

export interface UpdateProductInput {
  companyId?: string | null;
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
  customFields?: Record<string, unknown>;
}

type ProductCategoryRelation = {
  id: string;
  name: string;
  parentId: string | null;
  parent: { name: string } | null;
} | null;

type ProductRecord = Record<string, unknown> & {
  productCategory?: ProductCategoryRelation;
};

function mapProduct(record: ProductRecord): OfferProduct {
  const relation = record.productCategory ?? null;
  const categoryLabel = relation
    ? buildStructuredCategoryLabel(relation)
    : ((record.category as string | null) ?? undefined);

  return {
    id: record.id as string,
    organizationId: record.organizationId as string,
    companyId: (record.companyId as string | null) ?? undefined,
    name: record.name as string,
    description: (record.description as string | null) ?? undefined,
    unitPrice: record.unitPrice as number,
    vatRate: record.vatRate as number,
    unit: (record.unit as string | null) ?? undefined,
    sku: (record.sku as string | null) ?? undefined,
    category: categoryLabel,
    categoryId: (relation?.id ?? (record.categoryId as string | null)) ?? undefined,
    imageUrl: (record.imageUrl as string | null) ?? undefined,
    isActive: (record.isActive as boolean) ?? true,
    minQuantity: (record.minQuantity as number | null) ?? undefined,
    maxQuantity: (record.maxQuantity as number | null) ?? undefined,
    customFields: (record.customFields as Record<string, unknown> | null) ?? undefined,
    createdBy: record.createdBy as string,
    createdAt: (record.createdAt as Date).toISOString(),
  };
}

const PRODUCT_SELECT = {
  id: true,
  organizationId: true,
  companyId: true,
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
  customFields: true,
  createdBy: true,
  createdAt: true,
  productCategory: {
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
} satisfies Prisma.OfferProductSelect;

const LEGACY_PRODUCT_SELECT = {
  id: true,
  organizationId: true,
  companyId: true,
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
  customFields: true,
  createdBy: true,
  createdAt: true,
} satisfies Prisma.OfferProductSelect;

export const productsRepository = {
  async list(orgId: string, search?: string, category?: string, isActive?: boolean, companyId?: string): Promise<OfferProduct[]> {
    const companyScope = companyId ? { OR: [{ companyId }, { companyId: null }] } : {};
    const args = {
      where: {
        organizationId: orgId,
        deletedAt: null,
        ...companyScope,
        ...(isActive !== undefined ? { isActive } : {}),
        ...(category ? { category } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { unit: { contains: search, mode: 'insensitive' as const } },
            { category: { contains: search, mode: 'insensitive' as const } },
          ],
        } : {}),
      },
      orderBy: [{ companyId: 'desc' }, { category: 'asc' }, { name: 'asc' }],
    } satisfies Pick<Prisma.OfferProductFindManyArgs, 'where' | 'orderBy'>;

    try {
      const rows = await prisma.offerProduct.findMany({
        ...args,
        select: PRODUCT_SELECT,
      });
      return rows.map((row) => mapProduct(row as ProductRecord));
    } catch (error) {
      if (!isMissingProductCategorySchemaError(error)) throw error;
      const rows = await prisma.offerProduct.findMany({
        ...args,
        select: LEGACY_PRODUCT_SELECT,
      });
      return rows.map((row) => mapProduct(row as ProductRecord));
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
    const categorySelection = await productCategoriesRepository.getResolvedLabel(
      input.organizationId,
      input.categoryId,
      input.category,
      input.companyId,
    );

    const baseData = {
      organizationId: input.organizationId,
      companyId: input.companyId ?? null,
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
      ...(input.customFields !== undefined
        ? { customFields: input.customFields as Prisma.InputJsonValue }
        : {}),
      createdBy: input.createdBy,
    } satisfies Omit<Prisma.OfferProductUncheckedCreateInput, 'categoryId'>;

    try {
      const row = await prisma.offerProduct.create({
        data: {
          ...baseData,
          categoryId: categorySelection.categoryId,
        },
        select: PRODUCT_SELECT,
      });
      return mapProduct(row as ProductRecord);
    } catch (error) {
      if (!isMissingProductCategorySchemaError(error)) throw error;
      const row = await prisma.offerProduct.create({
        data: baseData,
        select: LEGACY_PRODUCT_SELECT,
      });
      return mapProduct(row as ProductRecord);
    }
  },

  async update(id: string, orgId: string, input: UpdateProductInput): Promise<OfferProduct | null> {
    const existing = await prisma.offerProduct.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    const categorySelection =
      input.categoryId !== undefined || input.category !== undefined
        ? await productCategoriesRepository.getResolvedLabel(orgId, input.categoryId, input.category, input.companyId)
        : null;

    const baseData = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.companyId !== undefined ? { companyId: input.companyId ?? null } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.unitPrice !== undefined ? { unitPrice: input.unitPrice } : {}),
      ...(input.vatRate !== undefined ? { vatRate: input.vatRate } : {}),
      ...(input.unit !== undefined ? { unit: input.unit } : {}),
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.minQuantity !== undefined ? { minQuantity: input.minQuantity } : {}),
      ...(input.maxQuantity !== undefined ? { maxQuantity: input.maxQuantity } : {}),
      ...(input.customFields !== undefined ? { customFields: input.customFields as Prisma.InputJsonValue } : {}),
      ...(categorySelection ? { category: categorySelection.category } : {}),
    } satisfies Omit<Prisma.OfferProductUncheckedUpdateInput, 'categoryId'>;

    try {
      const row = await prisma.offerProduct.update({
        where: { id },
        data: {
          ...baseData,
          ...(categorySelection ? { categoryId: categorySelection.categoryId } : {}),
        },
        select: PRODUCT_SELECT,
      });
      return mapProduct(row as ProductRecord);
    } catch (error) {
      if (!isMissingProductCategorySchemaError(error)) throw error;
      const row = await prisma.offerProduct.update({
        where: { id },
        data: baseData,
        select: LEGACY_PRODUCT_SELECT,
      });
      return mapProduct(row as ProductRecord);
    }
  },

  async delete(id: string, orgId: string): Promise<boolean> {
    const existing = await prisma.offerProduct.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return false;

    await prisma.offerProduct.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
    return true;
  },
};

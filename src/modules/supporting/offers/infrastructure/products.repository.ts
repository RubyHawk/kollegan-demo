import { prisma } from '@platform/database/prisma';
import type { OfferProduct } from '../domain/offer.entity';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CreateProductInput {
  organizationId: string;
  name:           string;
  description?:   string;
  unitPrice:      number;
  vatRate?:       number;
  unit?:          string;
  sku?:           string;
  category?:      string;
  imageUrl?:      string;
  isActive?:      boolean;
  minQuantity?:   number;
  maxQuantity?:   number;
  createdBy:      string;
}

export interface UpdateProductInput {
  name?:        string;
  description?: string;
  unitPrice?:   number;
  vatRate?:     number;
  unit?:        string;
  sku?:         string;
  category?:    string;
  imageUrl?:    string;
  isActive?:    boolean;
  minQuantity?: number;
  maxQuantity?: number;
}

// ─── Mapper ────────────────────────────────────────────────────────────────────

function mapProduct(r: Record<string, unknown>): OfferProduct {
  return {
    id:             r.id as string,
    organizationId: r.organizationId as string,
    name:           r.name as string,
    description:    (r.description as string | null) ?? undefined,
    unitPrice:      r.unitPrice as number,
    vatRate:        r.vatRate as number,
    unit:           (r.unit as string | null) ?? undefined,
    sku:            (r.sku as string | null) ?? undefined,
    category:       (r.category as string | null) ?? undefined,
    imageUrl:       (r.imageUrl as string | null) ?? undefined,
    isActive:       (r.isActive as boolean) ?? true,
    minQuantity:    (r.minQuantity as number | null) ?? undefined,
    maxQuantity:    (r.maxQuantity as number | null) ?? undefined,
    createdBy:      r.createdBy as string,
    createdAt:      (r.createdAt as Date).toISOString(),
  };
}

const PRODUCT_SELECT = {
  id: true, organizationId: true, name: true, description: true,
  unitPrice: true, vatRate: true, unit: true,
  sku: true, category: true, imageUrl: true, isActive: true,
  minQuantity: true, maxQuantity: true,
  createdBy: true, createdAt: true,
};

// ─── Repository ────────────────────────────────────────────────────────────────

export const productsRepository = {

  async list(orgId: string, search?: string, category?: string, isActive?: boolean): Promise<OfferProduct[]> {
    const rows = await prisma.offerProduct.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        ...(isActive !== undefined ? { isActive } : {}),
        ...(category ? { category } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      select: PRODUCT_SELECT,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return rows.map((r: unknown) => mapProduct(r as Record<string, unknown>));
  },

  async listCategories(orgId: string): Promise<string[]> {
    const rows = await prisma.offerProduct.findMany({
      where: { organizationId: orgId, deletedAt: null, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return rows.map((r) => r.category as string).filter(Boolean);
  },

  async create(input: CreateProductInput): Promise<OfferProduct> {
    const row = await prisma.offerProduct.create({
      data: {
        organizationId: input.organizationId,
        name:           input.name,
        description:    input.description ?? null,
        unitPrice:      input.unitPrice,
        vatRate:        input.vatRate ?? 0.25,
        unit:           input.unit ?? null,
        sku:            input.sku ?? null,
        category:       input.category ?? null,
        imageUrl:       input.imageUrl ?? null,
        isActive:       input.isActive ?? true,
        minQuantity:    input.minQuantity ?? null,
        maxQuantity:    input.maxQuantity ?? null,
        createdBy:      input.createdBy,
      },
      select: PRODUCT_SELECT,
    });
    return mapProduct(row as unknown as Record<string, unknown>);
  },

  async update(id: string, orgId: string, input: UpdateProductInput): Promise<OfferProduct | null> {
    const existing = await prisma.offerProduct.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return null;
    const row = await prisma.offerProduct.update({
      where: { id },
      data: {
        ...(input.name        !== undefined ? { name: input.name }               : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.unitPrice   !== undefined ? { unitPrice: input.unitPrice }     : {}),
        ...(input.vatRate     !== undefined ? { vatRate: input.vatRate }         : {}),
        ...(input.unit        !== undefined ? { unit: input.unit }               : {}),
        ...(input.sku         !== undefined ? { sku: input.sku }                 : {}),
        ...(input.category    !== undefined ? { category: input.category }       : {}),
        ...(input.imageUrl    !== undefined ? { imageUrl: input.imageUrl }       : {}),
        ...(input.isActive    !== undefined ? { isActive: input.isActive }       : {}),
        ...(input.minQuantity !== undefined ? { minQuantity: input.minQuantity } : {}),
        ...(input.maxQuantity !== undefined ? { maxQuantity: input.maxQuantity } : {}),
      },
      select: PRODUCT_SELECT,
    });
    return mapProduct(row as unknown as Record<string, unknown>);
  },

  async delete(id: string, orgId: string): Promise<boolean> {
    const existing = await prisma.offerProduct.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return false;
    await prisma.offerProduct.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  },
};

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
  createdBy:      string;
}

export interface UpdateProductInput {
  name?:        string;
  description?: string;
  unitPrice?:   number;
  vatRate?:     number;
  unit?:        string;
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
    createdBy:      r.createdBy as string,
    createdAt:      (r.createdAt as Date).toISOString(),
  };
}

const PRODUCT_SELECT = {
  id: true, organizationId: true, name: true, description: true,
  unitPrice: true, vatRate: true, unit: true, createdBy: true, createdAt: true,
};

// ─── Repository ────────────────────────────────────────────────────────────────

export const productsRepository = {

  async list(orgId: string, search?: string): Promise<OfferProduct[]> {
    const rows = await prisma.offerProduct.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      select: PRODUCT_SELECT,
      orderBy: { name: 'asc' },
    });
    return rows.map((r: unknown) => mapProduct(r as Record<string, unknown>));
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

import { prisma } from '@platform/database/prisma';
import type {
  CreateSupplierInput,
  PurchaseOrder,
  PurchaseOrderItemInput,
  PurchaseOrderLineItem,
  Supplier,
  UpdateSupplierInput,
} from '../domain/procurement.entity';

export interface ListSuppliersFilter {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreatePurchaseOrderInput {
  organizationId: string;
  projectId: string;
  supplierId: string;
  items: PurchaseOrderItemInput[];
  expectedDeliveryDate?: Date | null;
  notes?: string | null;
  createdBy?: string | null;
}

function iso(value: unknown): string | null {
  return value ? (value as Date).toISOString() : null;
}

function mapSupplier(row: Record<string, unknown>): Supplier {
  return {
    id: row.id as string,
    organizationId: row.organizationId as string,
    name: row.name as string,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    orgNumber: (row.orgNumber as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    postalCode: (row.postalCode as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdBy: (row.createdBy as string | null) ?? null,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  };
}

function mapLineItem(row: Record<string, unknown>): PurchaseOrderLineItem {
  return {
    id: row.id as string,
    organizationId: row.organizationId as string,
    purchaseOrderId: row.purchaseOrderId as string,
    projectLineItemId: (row.projectLineItemId as string | null) ?? null,
    description: row.description as string,
    quantity: row.quantity as number,
    receivedQuantity: row.receivedQuantity as number,
    unit: row.unit as string,
    unitCost: row.unitCost as number,
    vatRate: row.vatRate as number,
    sortOrder: row.sortOrder as number,
    createdAt: (row.createdAt as Date).toISOString(),
  };
}

function mapPurchaseOrder(row: Record<string, unknown>): PurchaseOrder {
  const supplier = row.supplier as Record<string, unknown> | undefined;
  const lineItems = row.lineItems as Record<string, unknown>[] | undefined;
  return {
    id: row.id as string,
    organizationId: row.organizationId as string,
    projectId: row.projectId as string,
    supplierId: row.supplierId as string,
    poNumber: (row.poNumber as number | null) ?? null,
    status: row.status as PurchaseOrder['status'],
    supplierReference: (row.supplierReference as string | null) ?? null,
    expectedDeliveryDate: iso(row.expectedDeliveryDate),
    submittedAt: iso(row.submittedAt),
    submittedBy: (row.submittedBy as string | null) ?? null,
    receivedAt: iso(row.receivedAt),
    receivedBy: (row.receivedBy as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    totalExVat: row.totalExVat as number,
    totalIncVat: row.totalIncVat as number,
    createdBy: (row.createdBy as string | null) ?? null,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
    supplier: supplier ? mapSupplier(supplier) : undefined,
    lineItems: lineItems ? lineItems.map(mapLineItem) : undefined,
  };
}

function computeTotals(items: PurchaseOrderItemInput[]) {
  return items.reduce((acc, item) => {
    const exVat = item.quantity * item.unitCost;
    const incVat = exVat * (1 + (item.vatRate ?? 0.25));
    return { totalExVat: acc.totalExVat + exVat, totalIncVat: acc.totalIncVat + incVat };
  }, { totalExVat: 0, totalIncVat: 0 });
}

const PURCHASE_ORDER_INCLUDE = {
  supplier: true,
  lineItems: { orderBy: { sortOrder: 'asc' as const } },
};

export const procurementRepository = {
  async listSuppliers(orgId: string, filter: ListSuppliersFilter): Promise<{ suppliers: Supplier[]; total: number }> {
    const where = {
      organizationId: orgId,
      deletedAt: null,
      ...(filter.search ? {
        OR: [
          { name: { contains: filter.search, mode: 'insensitive' as const } },
          { email: { contains: filter.search, mode: 'insensitive' as const } },
          { orgNumber: { contains: filter.search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        take: filter.limit ?? 50,
        skip: filter.offset ?? 0,
      }),
      prisma.supplier.count({ where }),
    ]);
    return { suppliers: (rows as unknown as Record<string, unknown>[]).map(mapSupplier), total };
  },

  async createSupplier(input: CreateSupplierInput): Promise<Supplier> {
    const row = await prisma.supplier.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        orgNumber: input.orgNumber ?? null,
        address: input.address ?? null,
        postalCode: input.postalCode ?? null,
        city: input.city ?? null,
        country: input.country ?? 'SE',
        notes: input.notes ?? null,
        createdBy: input.createdBy ?? null,
      },
    });
    return mapSupplier(row as unknown as Record<string, unknown>);
  },

  async updateSupplier(id: string, orgId: string, input: UpdateSupplierInput): Promise<Supplier | null> {
    const existing = await prisma.supplier.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return null;
    const row = await prisma.supplier.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.orgNumber !== undefined ? { orgNumber: input.orgNumber } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });
    return mapSupplier(row as unknown as Record<string, unknown>);
  },

  async softDeleteSupplier(id: string, orgId: string): Promise<boolean> {
    const existing = await prisma.supplier.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return false;
    await prisma.supplier.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  },

  async findProject(projectId: string, orgId: string) {
    return prisma.project.findFirst({ where: { id: projectId, organizationId: orgId, deletedAt: null } });
  },

  async createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    const supplier = await prisma.supplier.findFirst({
      where: { id: input.supplierId, organizationId: input.organizationId, deletedAt: null },
    });
    if (!supplier) throw Object.assign(new Error('Supplier not found'), { code: 'SUPPLIER_NOT_FOUND' });

    const totals = computeTotals(input.items);
    const max = await prisma.purchaseOrder.aggregate({
      where: { organizationId: input.organizationId },
      _max: { poNumber: true },
    });
    const row = await prisma.purchaseOrder.create({
      data: {
        organizationId: input.organizationId,
        projectId: input.projectId,
        supplierId: input.supplierId,
        poNumber: (max._max.poNumber ?? 0) + 1,
        expectedDeliveryDate: input.expectedDeliveryDate ?? null,
        notes: input.notes ?? null,
        createdBy: input.createdBy ?? null,
        totalExVat: totals.totalExVat,
        totalIncVat: totals.totalIncVat,
        lineItems: {
          create: input.items.map((item, idx) => ({
            organizationId: input.organizationId,
            projectLineItemId: item.projectLineItemId ?? null,
            description: item.description,
            quantity: item.quantity,
            receivedQuantity: 0,
            unit: item.unit ?? 'st',
            unitCost: item.unitCost,
            vatRate: item.vatRate ?? 0.25,
            sortOrder: idx,
          })),
        },
      },
      include: PURCHASE_ORDER_INCLUDE,
    });
    return mapPurchaseOrder(row as unknown as Record<string, unknown>);
  },

  async findPurchaseOrder(poId: string, projectId: string, orgId: string): Promise<PurchaseOrder | null> {
    const row = await prisma.purchaseOrder.findFirst({
      where: { id: poId, projectId, organizationId: orgId, deletedAt: null },
      include: PURCHASE_ORDER_INCLUDE,
    });
    return row ? mapPurchaseOrder(row as unknown as Record<string, unknown>) : null;
  },

  async submitPurchaseOrder(
    poId: string,
    projectId: string,
    orgId: string,
    actorId: string,
    input: { supplierReference?: string | null; expectedDeliveryDate?: Date | null; notes?: string | null },
  ): Promise<PurchaseOrder | null> {
    const existing = await prisma.purchaseOrder.findFirst({
      where: { id: poId, projectId, organizationId: orgId, deletedAt: null },
    });
    if (!existing) return null;
    const row = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
        submittedBy: actorId,
        ...(input.supplierReference !== undefined ? { supplierReference: input.supplierReference } : {}),
        ...(input.expectedDeliveryDate !== undefined ? { expectedDeliveryDate: input.expectedDeliveryDate } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      include: PURCHASE_ORDER_INCLUDE,
    });
    return mapPurchaseOrder(row as unknown as Record<string, unknown>);
  },

  async receivePurchaseOrder(
    poId: string,
    projectId: string,
    orgId: string,
    actorId: string,
    receivedItems?: Array<{ lineItemId: string; receivedQuantity: number }>,
    notes?: string | null,
  ): Promise<PurchaseOrder | null> {
    const existing = await prisma.purchaseOrder.findFirst({
      where: { id: poId, projectId, organizationId: orgId, deletedAt: null },
      include: { lineItems: true },
    });
    if (!existing) return null;

    await prisma.$transaction(async (tx) => {
      if (receivedItems?.length) {
        for (const item of receivedItems) {
          await tx.purchaseOrderLineItem.updateMany({
            where: { id: item.lineItemId, purchaseOrderId: poId, organizationId: orgId },
            data: { receivedQuantity: item.receivedQuantity },
          });
        }
      } else {
        for (const item of existing.lineItems) {
          await tx.purchaseOrderLineItem.update({
            where: { id: item.id },
            data: { receivedQuantity: item.quantity },
          });
        }
      }
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'received', receivedAt: new Date(), receivedBy: actorId, ...(notes !== undefined ? { notes } : {}) },
      });
    });

    return procurementRepository.findPurchaseOrder(poId, projectId, orgId);
  },
};

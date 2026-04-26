import { prisma } from '@platform/database/prisma';
import type {
  InstallDetails,
  Project,
  ProjectLineItem,
  ProjectStage,
  ProjectStageEvent,
} from '../domain/project.entity';

export interface ListProjectsFilter {
  stage?: ProjectStage;
  search?: string;
  customerId?: string;
  limit?: number;
  offset?: number;
}

export interface SnapshotLineItemInput {
  sourceOfferLineItemId?: string | null;
  sourceProductId?: string | null;
  productName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  discount: number;
  lineTotalExVat: number;
  lineTotalIncVat: number;
  sortOrder: number;
}

export interface CreateProjectFromOfferData {
  organizationId: string;
  customerId: string;
  offerId: string;
  name: string;
  offerNumber?: number | null;
  offerAcceptedAt?: Date | null;
  priceDisplayMode: string;
  totalExVat: number;
  totalIncVat: number;
  createdBy?: string | null;
  lineItems: SnapshotLineItemInput[];
}

function iso(value: unknown): string | null {
  return value ? (value as Date).toISOString() : null;
}

function mapLineItem(row: Record<string, unknown>): ProjectLineItem {
  return {
    id: row.id as string,
    organizationId: row.organizationId as string,
    projectId: row.projectId as string,
    sourceOfferLineItemId: (row.sourceOfferLineItemId as string | null) ?? null,
    sourceProductId: (row.sourceProductId as string | null) ?? null,
    productName: row.productName as string,
    description: row.description as string,
    quantity: row.quantity as number,
    unit: row.unit as string,
    unitPrice: row.unitPrice as number,
    vatRate: row.vatRate as number,
    discount: row.discount as number,
    lineTotalExVat: row.lineTotalExVat as number,
    lineTotalIncVat: row.lineTotalIncVat as number,
    sortOrder: row.sortOrder as number,
    createdAt: (row.createdAt as Date).toISOString(),
  };
}

function mapStageEvent(row: Record<string, unknown>): ProjectStageEvent {
  return {
    id: row.id as string,
    organizationId: row.organizationId as string,
    projectId: row.projectId as string,
    fromStage: (row.fromStage as ProjectStage | null) ?? null,
    toStage: row.toStage as ProjectStage,
    actorId: (row.actorId as string | null) ?? null,
    reason: (row.reason as string | null) ?? null,
    metadata: row.metadata ?? null,
    createdAt: (row.createdAt as Date).toISOString(),
  };
}

function mapCustomer(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    organizationId: row.organizationId as string,
    name: row.name as string,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    company: (row.company as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    postalCode: (row.postalCode as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    convertedFromLeadId: (row.convertedFromLeadId as string | null) ?? null,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  };
}

function mapPurchaseOrder(row: Record<string, unknown>) {
  const supplier = row.supplier as Record<string, unknown> | undefined;
  const lineItems = row.lineItems as Record<string, unknown>[] | undefined;
  return {
    id: row.id as string,
    organizationId: row.organizationId as string,
    projectId: row.projectId as string,
    supplierId: row.supplierId as string,
    poNumber: (row.poNumber as number | null) ?? null,
    status: row.status as 'draft' | 'submitted' | 'received' | 'cancelled',
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
    supplier: supplier ? {
      id: supplier.id as string,
      organizationId: supplier.organizationId as string,
      name: supplier.name as string,
      email: (supplier.email as string | null) ?? null,
      phone: (supplier.phone as string | null) ?? null,
      orgNumber: (supplier.orgNumber as string | null) ?? null,
      address: (supplier.address as string | null) ?? null,
      postalCode: (supplier.postalCode as string | null) ?? null,
      city: (supplier.city as string | null) ?? null,
      country: (supplier.country as string | null) ?? null,
      notes: (supplier.notes as string | null) ?? null,
      createdBy: (supplier.createdBy as string | null) ?? null,
      createdAt: (supplier.createdAt as Date).toISOString(),
      updatedAt: (supplier.updatedAt as Date).toISOString(),
    } : undefined,
    lineItems: lineItems?.map((item) => ({
      id: item.id as string,
      organizationId: item.organizationId as string,
      purchaseOrderId: item.purchaseOrderId as string,
      projectLineItemId: (item.projectLineItemId as string | null) ?? null,
      description: item.description as string,
      quantity: item.quantity as number,
      receivedQuantity: item.receivedQuantity as number,
      unit: item.unit as string,
      unitCost: item.unitCost as number,
      vatRate: item.vatRate as number,
      sortOrder: item.sortOrder as number,
      createdAt: (item.createdAt as Date).toISOString(),
    })),
  };
}

function mapProject(row: Record<string, unknown>): Project {
  const customer = row.customer as Record<string, unknown> | undefined;
  const lineItems = row.lineItems as Record<string, unknown>[] | undefined;
  const purchaseOrders = row.purchaseOrders as Record<string, unknown>[] | undefined;
  const stageEvents = row.stageEvents as Record<string, unknown>[] | undefined;
  return {
    id: row.id as string,
    organizationId: row.organizationId as string,
    customerId: row.customerId as string,
    offerId: row.offerId as string,
    name: row.name as string,
    stage: row.stage as ProjectStage,
    offerNumber: (row.offerNumber as number | null) ?? null,
    offerAcceptedAt: iso(row.offerAcceptedAt),
    priceDisplayMode: row.priceDisplayMode as string,
    totalExVat: row.totalExVat as number,
    totalIncVat: row.totalIncVat as number,
    siteAddress: (row.siteAddress as string | null) ?? null,
    sitePostalCode: (row.sitePostalCode as string | null) ?? null,
    siteCity: (row.siteCity as string | null) ?? null,
    siteCountry: (row.siteCountry as string | null) ?? null,
    squareMeters: (row.squareMeters as number | null) ?? null,
    objectType: (row.objectType as string | null) ?? null,
    objectDescription: (row.objectDescription as string | null) ?? null,
    accessNotes: (row.accessNotes as string | null) ?? null,
    wishedInstallDate: iso(row.wishedInstallDate),
    wishedInstallDateText: (row.wishedInstallDateText as string | null) ?? null,
    onsiteContactName: (row.onsiteContactName as string | null) ?? null,
    onsiteContactPhone: (row.onsiteContactPhone as string | null) ?? null,
    onsiteContactEmail: (row.onsiteContactEmail as string | null) ?? null,
    internalNotes: (row.internalNotes as string | null) ?? null,
    createdBy: (row.createdBy as string | null) ?? null,
    completedAt: iso(row.completedAt),
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
    customer: customer ? mapCustomer(customer) : undefined,
    lineItems: lineItems?.map(mapLineItem),
    purchaseOrders: purchaseOrders?.map(mapPurchaseOrder),
    stageEvents: stageEvents?.map(mapStageEvent),
  };
}

const PROJECT_INCLUDE = {
  customer: true,
  lineItems: { orderBy: { sortOrder: 'asc' as const } },
  purchaseOrders: {
    where: { deletedAt: null },
    include: { supplier: true, lineItems: { orderBy: { sortOrder: 'asc' as const } } },
    orderBy: { createdAt: 'desc' as const },
  },
  stageEvents: { orderBy: { createdAt: 'desc' as const } },
};

export const projectsRepository = {
  async findOrgsWithPendingBackfill(limit = 50): Promise<string[]> {
    const rows = await prisma.offer.findMany({
      where: { status: 'accepted', deletedAt: null, projects: { none: {} } },
      select: { organizationId: true },
      distinct: ['organizationId'],
      take: limit,
    });
    return rows.map((r) => r.organizationId);
  },

  async findAcceptedOfferIdsWithoutProjects(orgId: string, limit = 100): Promise<string[]> {
    const rows = await prisma.offer.findMany({
      where: {
        organizationId: orgId,
        status: 'accepted',
        deletedAt: null,
        projects: { none: {} },
      },
      select: { id: true },
      orderBy: { acceptedAt: 'asc' },
      take: limit,
    });
    return rows.map((row) => row.id);
  },

  async findByOfferId(offerId: string, orgId: string): Promise<Project | null> {
    const row = await prisma.project.findFirst({
      where: { offerId, organizationId: orgId, deletedAt: null },
      include: PROJECT_INCLUDE,
    });
    return row ? mapProject(row as unknown as Record<string, unknown>) : null;
  },

  async createFromOffer(input: CreateProjectFromOfferData): Promise<Project> {
    const row = await prisma.project.create({
      data: {
        organizationId: input.organizationId,
        customerId: input.customerId,
        offerId: input.offerId,
        name: input.name,
        offerNumber: input.offerNumber ?? null,
        offerAcceptedAt: input.offerAcceptedAt ?? null,
        priceDisplayMode: input.priceDisplayMode,
        totalExVat: input.totalExVat,
        totalIncVat: input.totalIncVat,
        createdBy: input.createdBy ?? null,
        lineItems: {
          create: input.lineItems.map((item) => ({
            organizationId: input.organizationId,
            sourceOfferLineItemId: item.sourceOfferLineItemId ?? null,
            sourceProductId: item.sourceProductId ?? null,
            productName: item.productName,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            discount: item.discount,
            lineTotalExVat: item.lineTotalExVat,
            lineTotalIncVat: item.lineTotalIncVat,
            sortOrder: item.sortOrder,
          })),
        },
        stageEvents: {
          create: {
            organizationId: input.organizationId,
            fromStage: null,
            toStage: 'details',
            actorId: 'system',
            reason: 'Offer accepted',
          },
        },
      },
      include: PROJECT_INCLUDE,
    });
    return mapProject(row as unknown as Record<string, unknown>);
  },

  async findById(id: string, orgId: string): Promise<Project | null> {
    const row = await prisma.project.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: PROJECT_INCLUDE,
    });
    return row ? mapProject(row as unknown as Record<string, unknown>) : null;
  },

  async list(orgId: string, filter: ListProjectsFilter): Promise<{ projects: Project[]; total: number }> {
    const where = {
      organizationId: orgId,
      deletedAt: null,
      ...(filter.stage ? { stage: filter.stage } : {}),
      ...(filter.customerId ? { customerId: filter.customerId } : {}),
      ...(filter.search ? {
        OR: [
          { name: { contains: filter.search, mode: 'insensitive' as const } },
          { customer: { name: { contains: filter.search, mode: 'insensitive' as const } } },
          { customer: { company: { contains: filter.search, mode: 'insensitive' as const } } },
        ],
      } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: PROJECT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: filter.limit ?? 50,
        skip: filter.offset ?? 0,
      }),
      prisma.project.count({ where }),
    ]);
    return { projects: (rows as unknown as Record<string, unknown>[]).map(mapProject), total };
  },

  async counts(orgId: string, filter: Pick<ListProjectsFilter, 'search' | 'customerId'>): Promise<Record<ProjectStage, number>> {
    const where = {
      organizationId: orgId,
      deletedAt: null,
      ...(filter.customerId ? { customerId: filter.customerId } : {}),
      ...(filter.search ? {
        OR: [
          { name: { contains: filter.search, mode: 'insensitive' as const } },
          { customer: { name: { contains: filter.search, mode: 'insensitive' as const } } },
          { customer: { company: { contains: filter.search, mode: 'insensitive' as const } } },
        ],
      } : {}),
    };
    const rows = await prisma.project.groupBy({ by: ['stage'], where, _count: { _all: true } });
    const counts: Record<ProjectStage, number> = {
      details: 0,
      ordered: 0,
      arrived: 0,
      in_progress: 0,
      completed: 0,
    };
    for (const row of rows) counts[row.stage as ProjectStage] = row._count._all;
    return counts;
  },

  async updateDetails(id: string, orgId: string, input: InstallDetails): Promise<Project | null> {
    const existing = await prisma.project.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return null;
    const row = await prisma.project.update({
      where: { id },
      data: {
        ...(input.siteAddress !== undefined ? { siteAddress: input.siteAddress } : {}),
        ...(input.sitePostalCode !== undefined ? { sitePostalCode: input.sitePostalCode } : {}),
        ...(input.siteCity !== undefined ? { siteCity: input.siteCity } : {}),
        ...(input.siteCountry !== undefined ? { siteCountry: input.siteCountry } : {}),
        ...(input.squareMeters !== undefined ? { squareMeters: input.squareMeters } : {}),
        ...(input.objectType !== undefined ? { objectType: input.objectType } : {}),
        ...(input.objectDescription !== undefined ? { objectDescription: input.objectDescription } : {}),
        ...(input.accessNotes !== undefined ? { accessNotes: input.accessNotes } : {}),
        ...(input.wishedInstallDate !== undefined ? { wishedInstallDate: input.wishedInstallDate } : {}),
        ...(input.wishedInstallDateText !== undefined ? { wishedInstallDateText: input.wishedInstallDateText } : {}),
        ...(input.onsiteContactName !== undefined ? { onsiteContactName: input.onsiteContactName } : {}),
        ...(input.onsiteContactPhone !== undefined ? { onsiteContactPhone: input.onsiteContactPhone } : {}),
        ...(input.onsiteContactEmail !== undefined ? { onsiteContactEmail: input.onsiteContactEmail } : {}),
        ...(input.internalNotes !== undefined ? { internalNotes: input.internalNotes } : {}),
      },
      include: PROJECT_INCLUDE,
    });
    return mapProject(row as unknown as Record<string, unknown>);
  },

  async advanceStage(id: string, orgId: string, toStage: ProjectStage, actorId: string): Promise<Project | null> {
    const existing = await prisma.project.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) return null;
    const row = await prisma.$transaction(async (tx) => {
      await tx.projectStageEvent.create({
        data: {
          organizationId: orgId,
          projectId: id,
          fromStage: existing.stage,
          toStage,
          actorId,
        },
      });
      return tx.project.update({
        where: { id },
        data: {
          stage: toStage,
          ...(toStage === 'completed' ? { completedAt: new Date() } : {}),
        },
        include: PROJECT_INCLUDE,
      });
    });
    return mapProject(row as unknown as Record<string, unknown>);
  },
};

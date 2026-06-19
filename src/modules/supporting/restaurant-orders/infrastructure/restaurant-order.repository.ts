import { Prisma, prisma } from '@platform/database/prisma';
import type {
  ListRestaurantOrdersInput,
  NormalizedOrderItem,
  RestaurantBusinessDayView,
  RestaurantMenuItemSnapshot,
  RestaurantOrderStatus,
  RestaurantOrderView,
  RestaurantPaymentStatus,
  RestaurantPaymentMethod,
  RestaurantFulfillmentType,
  RestaurantOrderSource,
  RestaurantBusinessDayStatus,
  RestaurantOrderTotals,
  UpdateRestaurantOrderInput,
} from '../domain/restaurant-order.entity';

const ACTIVE_ORDER_STATUSES: RestaurantOrderStatus[] = ['new', 'preparing', 'ready'];
const MAX_ORDER_NUMBER_RETRIES = 5;

type BusinessDayRow = {
  id: string;
  organizationId: string;
  businessDate: Date;
  status: string;
  openedBy: string | null;
  openedAt: Date;
  closedBy: string | null;
  closedAt: Date | null;
  openingNote: string | null;
  closingNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type OrderItemRow = {
  id: string;
  menuItemId: string | null;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  note: string | null;
  sortOrder: number;
};

type OrderRow = {
  id: string;
  organizationId: string;
  businessDayId: string | null;
  orderNumber: number;
  source: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  fulfillmentType: string;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  note: string | null;
  subtotalCents: number;
  totalCents: number;
  currency: string;
  paidAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemRow[];
};

const ORDER_INCLUDE = {
  items: {
    orderBy: { sortOrder: 'asc' as const },
    select: {
      id: true,
      menuItemId: true,
      name: true,
      quantity: true,
      unitPriceCents: true,
      lineTotalCents: true,
      note: true,
      sortOrder: true,
    },
  },
} as const;

function mapBusinessDay(row: BusinessDayRow): RestaurantBusinessDayView {
  return {
    id: row.id,
    organizationId: row.organizationId,
    businessDate: row.businessDate.toISOString(),
    status: row.status as RestaurantBusinessDayStatus,
    openedBy: row.openedBy,
    openedAt: row.openedAt.toISOString(),
    closedBy: row.closedBy,
    closedAt: row.closedAt?.toISOString() ?? null,
    openingNote: row.openingNote,
    closingNote: row.closingNote,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapOrder(row: OrderRow): RestaurantOrderView {
  return {
    id: row.id,
    organizationId: row.organizationId,
    businessDayId: row.businessDayId,
    orderNumber: row.orderNumber,
    source: row.source as RestaurantOrderSource,
    status: row.status as RestaurantOrderStatus,
    paymentStatus: row.paymentStatus as RestaurantPaymentStatus,
    paymentMethod: row.paymentMethod as RestaurantPaymentMethod | null,
    fulfillmentType: row.fulfillmentType as RestaurantFulfillmentType,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    deliveryAddress: row.deliveryAddress,
    note: row.note,
    subtotalCents: row.subtotalCents,
    totalCents: row.totalCents,
    currency: row.currency,
    paidAt: row.paidAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    items: row.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
      note: item.note,
      sortOrder: item.sortOrder,
    })),
  };
}

function buildOrderWhere(
  organizationId: string,
  input: ListRestaurantOrdersInput = {},
): Prisma.RestaurantOrderWhereInput {
  return {
    organizationId,
    deletedAt: null,
    ...(input.businessDayId ? { businessDayId: input.businessDayId } : {}),
    ...(input.activeOnly ? { status: { in: ACTIVE_ORDER_STATUSES } } : input.status ? { status: input.status } : {}),
    ...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
    ...(input.from || input.to ? {
      createdAt: {
        ...(input.from ? { gte: new Date(input.from) } : {}),
        ...(input.to ? { lte: new Date(input.to) } : {}),
      },
    } : {}),
  };
}

function isRetryableOrderNumberConflict(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(err.code);
}

export const restaurantOrderRepository = {
  async getOpenBusinessDay(organizationId: string): Promise<RestaurantBusinessDayView | null> {
    const row = await prisma.restaurantBusinessDay.findFirst({
      where: { organizationId, status: 'open', closedAt: null, deletedAt: null },
      orderBy: { openedAt: 'desc' },
    });
    return row ? mapBusinessDay(row as BusinessDayRow) : null;
  },

  async getBusinessDayById(organizationId: string, id: string): Promise<RestaurantBusinessDayView | null> {
    const row = await prisma.restaurantBusinessDay.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return row ? mapBusinessDay(row as BusinessDayRow) : null;
  },

  async startBusinessDay(
    organizationId: string,
    actorId: string,
    businessDate: Date,
    openingNote: string | null,
  ): Promise<RestaurantBusinessDayView> {
    const row = await prisma.restaurantBusinessDay.create({
      data: {
        organizationId,
        businessDate,
        status: 'open',
        openedBy: actorId,
        openingNote,
      },
    });
    return mapBusinessDay(row as BusinessDayRow);
  },

  async closeBusinessDay(
    organizationId: string,
    id: string,
    actorId: string,
    closingNote: string | null,
  ): Promise<RestaurantBusinessDayView | null> {
    const existing = await prisma.restaurantBusinessDay.findFirst({
      where: { id, organizationId, status: 'open', closedAt: null, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.restaurantBusinessDay.update({
      where: { id },
      data: {
        status: 'closed',
        closedBy: actorId,
        closedAt: new Date(),
        closingNote,
      },
    });
    return mapBusinessDay(row as BusinessDayRow);
  },

  async findMenuItemsByIds(organizationId: string, ids: string[]): Promise<RestaurantMenuItemSnapshot[]> {
    if (ids.length === 0) return [];
    return prisma.restaurantMenuItem.findMany({
      where: { id: { in: ids }, organizationId, deletedAt: null },
      select: { id: true, name: true, priceCents: true, currency: true, isAvailable: true, tags: true },
    });
  },

  async createOrder(
    organizationId: string,
    businessDayId: string,
    actorId: string | null,
    input: {
      source?: RestaurantOrderSource;
      fulfillmentType: RestaurantFulfillmentType;
      customerName: string | null;
      customerPhone?: string | null;
      deliveryAddress?: string | null;
      note: string | null;
      paymentStatus: RestaurantPaymentStatus;
      paymentMethod: RestaurantPaymentMethod | null;
      items: NormalizedOrderItem[];
      totals: RestaurantOrderTotals;
    },
  ): Promise<RestaurantOrderView> {
    for (let attempt = 0; attempt < MAX_ORDER_NUMBER_RETRIES; attempt++) {
      try {
        const row = await prisma.$transaction(async (tx) => {
          const maxNumber = await tx.restaurantOrder.aggregate({
            where: { organizationId, businessDayId, deletedAt: null },
            _max: { orderNumber: true },
          });
          const orderNumber = (maxNumber._max.orderNumber ?? 0) + 1;
          const now = new Date();

          return tx.restaurantOrder.create({
            data: {
              organizationId,
              businessDayId,
              orderNumber,
              source: input.source ?? 'portal',
              status: 'new',
              paymentStatus: input.paymentStatus,
              paymentMethod: input.paymentMethod,
              fulfillmentType: input.fulfillmentType,
              customerName: input.customerName,
              customerPhone: input.customerPhone ?? null,
              deliveryAddress: input.deliveryAddress ?? null,
              note: input.note,
              subtotalCents: input.totals.subtotalCents,
              totalCents: input.totals.totalCents,
              currency: input.totals.currency,
              paidAt: input.paymentStatus === 'paid' ? now : null,
              createdBy: actorId,
              updatedBy: actorId,
              items: {
                create: input.items.map((item) => ({
                  organizationId,
                  menuItemId: item.menuItemId,
                  name: item.name,
                  quantity: item.quantity,
                  unitPriceCents: item.unitPriceCents,
                  lineTotalCents: item.lineTotalCents,
                  note: item.note,
                  sortOrder: item.sortOrder,
                })),
              },
            },
            include: ORDER_INCLUDE,
          });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        return mapOrder(row as OrderRow);
      } catch (err) {
        if (!isRetryableOrderNumberConflict(err) || attempt === MAX_ORDER_NUMBER_RETRIES - 1) throw err;
      }
    }

    throw new Error('Failed to allocate restaurant order number');
  },

  async getOrderById(organizationId: string, id: string): Promise<RestaurantOrderView | null> {
    const row = await prisma.restaurantOrder.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: ORDER_INCLUDE,
    });
    return row ? mapOrder(row as OrderRow) : null;
  },

  async listOrders(organizationId: string, input: ListRestaurantOrdersInput = {}): Promise<RestaurantOrderView[]> {
    const rows = await prisma.restaurantOrder.findMany({
      where: buildOrderWhere(organizationId, input),
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
      include: ORDER_INCLUDE,
    });
    return rows.map((row) => mapOrder(row as OrderRow));
  },

  async listOrdersForSummary(
    organizationId: string,
    input: ListRestaurantOrdersInput = {},
  ): Promise<RestaurantOrderView[]> {
    const rows = await prisma.restaurantOrder.findMany({
      where: buildOrderWhere(organizationId, input),
      orderBy: [{ createdAt: 'desc' }],
      include: ORDER_INCLUDE,
    });
    return rows.map((row) => mapOrder(row as OrderRow));
  },

  async countBusinessDayBlockingOrders(
    organizationId: string,
    businessDayId: string,
  ): Promise<{ activeCount: number; unpaidCount: number }> {
    const [activeCount, unpaidCount] = await Promise.all([
      prisma.restaurantOrder.count({
        where: {
          organizationId,
          businessDayId,
          deletedAt: null,
          status: { in: ACTIVE_ORDER_STATUSES },
        },
      }),
      prisma.restaurantOrder.count({
        where: {
          organizationId,
          businessDayId,
          deletedAt: null,
          status: { not: 'cancelled' },
          paymentStatus: 'unpaid',
        },
      }),
    ]);
    return { activeCount, unpaidCount };
  },

  async updateOrder(
    organizationId: string,
    id: string,
    actorId: string,
    input: UpdateRestaurantOrderInput,
  ): Promise<RestaurantOrderView | null> {
    const existing = await prisma.restaurantOrder.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    const now = new Date();
    const row = await prisma.restaurantOrder.update({
      where: { id },
      data: {
        ...(input.status !== undefined ? {
          status: input.status,
          ...(input.status === 'completed' ? { completedAt: now } : {}),
          ...(input.status === 'cancelled' ? { cancelledAt: now } : {}),
        } : {}),
        ...(input.paymentStatus !== undefined ? {
          paymentStatus: input.paymentStatus,
          paidAt: input.paymentStatus === 'paid' ? now : input.paymentStatus === 'unpaid' ? null : undefined,
        } : {}),
        ...(input.paymentMethod !== undefined ? { paymentMethod: input.paymentMethod } : {}),
        ...(input.customerName !== undefined ? { customerName: input.customerName } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
        updatedBy: actorId,
      },
      include: ORDER_INCLUDE,
    });
    return mapOrder(row as OrderRow);
  },
};


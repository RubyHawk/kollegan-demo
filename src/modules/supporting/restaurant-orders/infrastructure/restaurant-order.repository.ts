import { Prisma, prisma } from '@platform/database/prisma';
import { deriveMenuVariantsFromPriceTags } from '@modules/supporting/restaurant-menu';
import type {
  ListRestaurantOrdersInput,
  NormalizedOrderItem,
  RestaurantBusinessDayView,
  RestaurantMenuItemSnapshot,
  RestaurantMenuModifierGroupSnapshot,
  RestaurantMenuModifierOptionSnapshot,
  RestaurantMenuVariantSnapshot,
  RestaurantOrderModifierSelection,
  RestaurantOrderStatus,
  RestaurantOrderView,
  RestaurantPaymentStatus,
  RestaurantPaymentMethod,
  RestaurantFulfillmentType,
  RestaurantKotStatus,
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
  variantName: string | null;
  variantPriceCents: number | null;
  selectedModifiers: Prisma.JsonValue | null;
  modifierTotalCents: number;
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
  tableLabel: string | null;
  bookingReference: string | null;
  note: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  taxRateBps: number;
  totalCents: number;
  currency: string;
  isHeld: boolean;
  kotStatus: string;
  sentToKitchenAt: Date | null;
  printedAt: Date | null;
  printCount: number;
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
      variantName: true,
      variantPriceCents: true,
      selectedModifiers: true,
      modifierTotalCents: true,
      unitPriceCents: true,
      lineTotalCents: true,
      note: true,
      sortOrder: true,
    },
  },
} as const;

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function int(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function parseOrderModifiers(value: Prisma.JsonValue | null | undefined): RestaurantOrderModifierSelection[] {
  if (!Array.isArray(value)) return [];
  const selections: RestaurantOrderModifierSelection[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const groupName = text(record.groupName);
    const optionName = text(record.optionName);
    if (!groupName || !optionName) continue;
    selections.push({
      groupId: text(record.groupId),
      groupName,
      optionId: text(record.optionId),
      optionName,
      priceDeltaCents: int(record.priceDeltaCents),
    });
  }
  return selections;
}

function parseMenuVariants(value: Prisma.JsonValue | null | undefined): RestaurantMenuVariantSnapshot[] {
  if (!Array.isArray(value)) return [];
  const variants: RestaurantMenuVariantSnapshot[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const name = text(record.name);
    const priceCents = int(record.priceCents, -1);
    if (!name || priceCents < 0) continue;
    variants.push({
      id: text(record.id),
      name,
      priceCents,
      isDefault: record.isDefault === true,
      isAvailable: record.isAvailable !== false,
      sortOrder: int(record.sortOrder, variants.length),
    });
  }
  return variants.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'sv'));
}

function parseMenuModifierOptions(value: unknown): RestaurantMenuModifierOptionSnapshot[] {
  if (!Array.isArray(value)) return [];
  const options: RestaurantMenuModifierOptionSnapshot[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const name = text(record.name);
    if (!name) continue;
    options.push({
      id: text(record.id),
      name,
      priceDeltaCents: int(record.priceDeltaCents),
      isAvailable: record.isAvailable !== false,
      sortOrder: int(record.sortOrder, options.length),
    });
  }
  return options.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'sv'));
}

function parseMenuModifierGroups(value: Prisma.JsonValue | null | undefined): RestaurantMenuModifierGroupSnapshot[] {
  if (!Array.isArray(value)) return [];
  const groups: RestaurantMenuModifierGroupSnapshot[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const name = text(record.name);
    const options = parseMenuModifierOptions(record.options);
    if (!name || options.length === 0) continue;
    const maxSelected = Math.max(1, int(record.maxSelected, 1));
    groups.push({
      id: text(record.id),
      name,
      minSelected: Math.min(int(record.minSelected, record.required === true ? 1 : 0), maxSelected),
      maxSelected,
      required: record.required === true,
      sortOrder: int(record.sortOrder, groups.length),
      options,
    });
  }
  return groups.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'sv'));
}

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
    tableLabel: row.tableLabel,
    bookingReference: row.bookingReference,
    note: row.note,
    subtotalCents: row.subtotalCents,
    discountCents: row.discountCents,
    taxCents: row.taxCents,
    taxRateBps: row.taxRateBps,
    totalCents: row.totalCents,
    currency: row.currency,
    isHeld: row.isHeld,
    kotStatus: row.kotStatus as RestaurantKotStatus,
    sentToKitchenAt: row.sentToKitchenAt?.toISOString() ?? null,
    printedAt: row.printedAt?.toISOString() ?? null,
    printCount: row.printCount,
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
      variantName: item.variantName,
      variantPriceCents: item.variantPriceCents,
      selectedModifiers: parseOrderModifiers(item.selectedModifiers),
      modifierTotalCents: item.modifierTotalCents,
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
      select: {
        id: true,
        name: true,
        priceCents: true,
        currency: true,
        isAvailable: true,
        tags: true,
        variants: true,
        modifierGroups: true,
      },
    }).then((rows) => rows.map((row) => {
      const parsedVariants = parseMenuVariants(row.variants);
      return {
        id: row.id,
        name: row.name,
        priceCents: row.priceCents,
        currency: row.currency,
        isAvailable: row.isAvailable,
        tags: row.tags,
        variants: parsedVariants.length > 0 || row.priceCents !== null
          ? parsedVariants
          : deriveMenuVariantsFromPriceTags(row.tags),
        modifierGroups: parseMenuModifierGroups(row.modifierGroups),
      };
    }));
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
      tableLabel?: string | null;
      bookingReference?: string | null;
      note: string | null;
      paymentStatus: RestaurantPaymentStatus;
      paymentMethod: RestaurantPaymentMethod | null;
      isHeld?: boolean;
      kotStatus?: RestaurantKotStatus;
      printReceipt?: boolean;
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
              tableLabel: input.tableLabel ?? null,
              bookingReference: input.bookingReference ?? null,
              note: input.note,
              subtotalCents: input.totals.subtotalCents,
              discountCents: input.totals.discountCents,
              taxCents: input.totals.taxCents,
              taxRateBps: input.totals.taxRateBps,
              totalCents: input.totals.totalCents,
              currency: input.totals.currency,
              isHeld: input.isHeld ?? false,
              kotStatus: input.printReceipt ? 'printed' : input.kotStatus ?? 'not_sent',
              sentToKitchenAt: ((input.kotStatus && input.kotStatus !== 'not_sent') || input.printReceipt) ? now : null,
              printedAt: input.printReceipt ? now : null,
              printCount: input.printReceipt ? 1 : 0,
              paidAt: input.paymentStatus === 'paid' ? now : null,
              createdBy: actorId,
              updatedBy: actorId,
              items: {
                create: input.items.map((item) => ({
                  organizationId,
                  menuItemId: item.menuItemId,
                  name: item.name,
                  quantity: item.quantity,
                  variantName: item.variantName,
                  variantPriceCents: item.variantPriceCents,
                  selectedModifiers: item.selectedModifiers as unknown as Prisma.InputJsonValue,
                  modifierTotalCents: item.modifierTotalCents,
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

  // Marks a public online order paid from a verified payment webhook. Org-unscoped by id (the webhook
  // has no JWT) but restricted to source='public'; idempotent and amount-guarded so a replayed or
  // tampered callback cannot flip the wrong order or an unexpected amount.
  async markPublicOrderPaid(
    orderId: string,
    method: 'card' | 'swish',
    amountCents: number | null,
  ): Promise<'paid' | 'already_paid' | 'amount_mismatch' | 'not_found'> {
    const order = await prisma.restaurantOrder.findFirst({
      where: { id: orderId, source: 'public', deletedAt: null },
      select: { id: true, paymentStatus: true, totalCents: true },
    });
    if (!order) return 'not_found';
    if (order.paymentStatus === 'paid') return 'already_paid';
    if (amountCents != null && amountCents !== order.totalCents) return 'amount_mismatch';
    await prisma.restaurantOrder.update({
      where: { id: order.id },
      // Mark paid and release the hold so a card/Swish order that was parked awaiting payment becomes
      // a normal active order once the provider confirms.
      data: { paymentStatus: 'paid', paymentMethod: method, paidAt: new Date(), isHeld: false },
    });
    return 'paid';
  },

  // Releases a held public order back to a normal (active) order — used when an online payment could
  // not be started, so the order falls back to pay-on-arrival instead of staying parked forever.
  async releaseHeldPublicOrder(orderId: string): Promise<void> {
    await prisma.restaurantOrder.updateMany({
      where: { id: orderId, source: 'public', isHeld: true, deletedAt: null },
      data: { isHeld: false },
    });
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
    const nextKotStatus = input.printReceipt ? 'printed' : input.kotStatus;
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
        ...(input.fulfillmentType !== undefined ? { fulfillmentType: input.fulfillmentType } : {}),
        ...(input.customerName !== undefined ? { customerName: input.customerName } : {}),
        ...(input.tableLabel !== undefined ? { tableLabel: input.tableLabel } : {}),
        ...(input.bookingReference !== undefined ? { bookingReference: input.bookingReference } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
        ...(input.isHeld !== undefined ? { isHeld: input.isHeld } : {}),
        ...(nextKotStatus !== undefined ? {
          kotStatus: nextKotStatus,
          ...(nextKotStatus !== 'not_sent' ? { sentToKitchenAt: now } : {}),
          ...(nextKotStatus === 'printed' ? { printedAt: now, printCount: { increment: 1 } } : {}),
        } : {}),
        updatedBy: actorId,
      },
      include: ORDER_INCLUDE,
    });
    return mapOrder(row as OrderRow);
  },
};


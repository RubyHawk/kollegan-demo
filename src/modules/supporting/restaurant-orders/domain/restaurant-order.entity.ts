import { parseMenuVariants } from '@shared/lib/menu/menu-variants';

export const RESTAURANT_ORDER_STATUSES = ['new', 'preparing', 'ready', 'completed', 'cancelled'] as const;
export const RESTAURANT_PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'] as const;
export const RESTAURANT_PAYMENT_METHODS = ['cash', 'card', 'swish', 'other'] as const;
export const RESTAURANT_FULFILLMENT_TYPES = ['takeaway', 'dine_in', 'counter', 'delivery'] as const;
export const PUBLIC_FULFILLMENT_TYPES = ['takeaway', 'delivery'] as const;

export type RestaurantOrderStatus = (typeof RESTAURANT_ORDER_STATUSES)[number];
export type RestaurantPaymentStatus = (typeof RESTAURANT_PAYMENT_STATUSES)[number];
export type RestaurantPaymentMethod = (typeof RESTAURANT_PAYMENT_METHODS)[number];
export type RestaurantFulfillmentType = (typeof RESTAURANT_FULFILLMENT_TYPES)[number];
export type RestaurantOrderSource = 'portal' | 'public';
export type RestaurantBusinessDayStatus = 'open' | 'closed';

export interface RestaurantBusinessDayView {
  id: string;
  organizationId: string;
  businessDate: string;
  status: RestaurantBusinessDayStatus;
  openedBy: string | null;
  openedAt: string;
  closedBy: string | null;
  closedAt: string | null;
  openingNote: string | null;
  closingNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantOrderItemView {
  id: string;
  menuItemId: string | null;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  note: string | null;
  sortOrder: number;
}

export interface RestaurantOrderView {
  id: string;
  organizationId: string;
  businessDayId: string | null;
  orderNumber: number;
  source: RestaurantOrderSource;
  status: RestaurantOrderStatus;
  paymentStatus: RestaurantPaymentStatus;
  paymentMethod: RestaurantPaymentMethod | null;
  fulfillmentType: RestaurantFulfillmentType;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  note: string | null;
  subtotalCents: number;
  totalCents: number;
  currency: string;
  paidAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  items: RestaurantOrderItemView[];
}

export interface CreateRestaurantOrderItemInput {
  menuItemId?: string | null;
  name?: string | null;
  quantity: number;
  unitPriceCents?: number | null;
  variantLabel?: string | null;
  note?: string | null;
}

export interface CreateRestaurantOrderInput {
  fulfillmentType?: RestaurantFulfillmentType;
  customerName?: string | null;
  note?: string | null;
  paymentStatus?: RestaurantPaymentStatus;
  paymentMethod?: RestaurantPaymentMethod | null;
  items: CreateRestaurantOrderItemInput[];
}

export interface UpdateRestaurantOrderInput {
  status?: RestaurantOrderStatus;
  paymentStatus?: RestaurantPaymentStatus;
  paymentMethod?: RestaurantPaymentMethod | null;
  customerName?: string | null;
  note?: string | null;
}

export interface ListRestaurantOrdersInput {
  businessDayId?: string;
  status?: RestaurantOrderStatus;
  paymentStatus?: RestaurantPaymentStatus;
  from?: string;
  to?: string;
  activeOnly?: boolean;
}

export interface StartBusinessDayInput {
  openingNote?: string | null;
}

export interface CloseBusinessDayInput {
  closingNote?: string | null;
}

export interface RestaurantMenuItemSnapshot {
  id: string;
  name: string;
  priceCents: number | null;
  currency: string;
  isAvailable: boolean;
  tags: string[];
}

export type PublicFulfillmentType = (typeof PUBLIC_FULFILLMENT_TYPES)[number];

// Customer-facing online order (public website). Name + phone are required so the kitchen can
// reach the customer; deliveryAddress is required by the service when fulfillmentType = delivery.
export interface CreatePublicRestaurantOrderInput {
  fulfillmentType: PublicFulfillmentType;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string | null;
  note?: string | null;
  items: CreateRestaurantOrderItemInput[];
}

export interface NormalizedOrderItem {
  menuItemId: string | null;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  note: string | null;
  sortOrder: number;
}

export interface RestaurantOrderTotals {
  subtotalCents: number;
  totalCents: number;
  currency: string;
}

export interface RestaurantOrderSummary {
  businessDay: RestaurantBusinessDayView | null;
  salesCents: number;
  orderCount: number;
  paidOrderCount: number;
  unpaidOrderCount: number;
  activeOrderCount: number;
  cancelledOrderCount: number;
  averageOrderCents: number;
  bestSellers: Array<{
    name: string;
    menuItemId: string | null;
    quantity: number;
    salesCents: number;
  }>;
  paymentMethods: Array<{
    method: RestaurantPaymentMethod | 'unknown';
    count: number;
    salesCents: number;
  }>;
}

const ACTIVE_STATUSES = new Set<RestaurantOrderStatus>(['new', 'preparing', 'ready']);

const STATUS_TRANSITIONS: Record<RestaurantOrderStatus, RestaurantOrderStatus[]> = {
  new: ['preparing', 'ready', 'completed', 'cancelled'],
  preparing: ['ready', 'completed', 'cancelled'],
  ready: ['preparing', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function isActiveOrderStatus(status: RestaurantOrderStatus): boolean {
  return ACTIVE_STATUSES.has(status);
}

export function assertOrderStatusTransition(
  current: RestaurantOrderStatus,
  next: RestaurantOrderStatus,
): void {
  if (current === next) return;
  if (!STATUS_TRANSITIONS[current]?.includes(next)) {
    throw new Error(`Order cannot move from ${current} to ${next}`);
  }
}

export function normalizeOrderItems(
  input: CreateRestaurantOrderItemInput[],
  menuItems: Map<string, RestaurantMenuItemSnapshot>,
): NormalizedOrderItem[] {
  return input.map((item, index) => {
    const menuItem = item.menuItemId ? menuItems.get(item.menuItemId) : null;
    const name = (menuItem?.name ?? item.name ?? '').trim();
    const quantity = Math.max(1, Math.floor(item.quantity));
    const unitPriceCents = Math.max(0, Math.floor(menuItem?.priceCents ?? item.unitPriceCents ?? 0));

    return {
      menuItemId: menuItem?.id ?? item.menuItemId ?? null,
      name,
      quantity,
      unitPriceCents,
      lineTotalCents: quantity * unitPriceCents,
      note: item.note?.trim() || null,
      sortOrder: index,
    };
  }).filter((item) => item.name);
}

/**
 * Variant-aware normalization for public online orders. Every line must reference an available menu
 * item; the price is taken from that item's own variants (parsed from the menu row), NEVER from the
 * client. A line is dropped when the item is unknown/unavailable, resolves to no priced variant, or
 * names a size that does not exist. The chosen size is appended to the stored line name, e.g.
 * "1. Det enkla (M)".
 */
export function buildPublicOrderItems(
  input: CreateRestaurantOrderItemInput[],
  menuItems: Map<string, RestaurantMenuItemSnapshot>,
): NormalizedOrderItem[] {
  const out: NormalizedOrderItem[] = [];
  for (const item of input) {
    const menuItem = item.menuItemId ? menuItems.get(item.menuItemId) : null;
    if (!menuItem || menuItem.isAvailable === false) continue;

    const variants = parseMenuVariants(menuItem.tags, menuItem.priceCents);
    if (variants.length === 0) continue;

    const wantsLabel = item.variantLabel != null && item.variantLabel !== '';
    const variant = wantsLabel
      ? variants.find((candidate) => candidate.label === item.variantLabel)
      : variants.length === 1
        ? variants[0]
        : undefined;
    if (!variant) continue;

    const quantity = Math.max(1, Math.floor(item.quantity));
    out.push({
      menuItemId: menuItem.id,
      name: variant.label ? `${menuItem.name} (${variant.label})` : menuItem.name,
      quantity,
      unitPriceCents: variant.priceCents,
      lineTotalCents: quantity * variant.priceCents,
      note: item.note?.trim() || null,
      sortOrder: out.length,
    });
  }
  return out;
}

export function calculateOrderTotals(items: NormalizedOrderItem[], currency = 'SEK'): RestaurantOrderTotals {
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  return {
    subtotalCents,
    totalCents: subtotalCents,
    currency,
  };
}

export function buildOrderSummary(
  businessDay: RestaurantBusinessDayView | null,
  orders: RestaurantOrderView[],
): RestaurantOrderSummary {
  const saleOrders = orders.filter((order) => order.status !== 'cancelled' && order.paymentStatus === 'paid');
  const salesCents = saleOrders.reduce((sum, order) => sum + order.totalCents, 0);
  const paidOrderCount = saleOrders.length;
  const bestSellerMap = new Map<string, { name: string; menuItemId: string | null; quantity: number; salesCents: number }>();
  const paymentMap = new Map<string, { method: RestaurantPaymentMethod | 'unknown'; count: number; salesCents: number }>();

  for (const order of saleOrders) {
    const method = order.paymentMethod ?? 'unknown';
    const payment = paymentMap.get(method) ?? { method, count: 0, salesCents: 0 };
    payment.count += 1;
    payment.salesCents += order.totalCents;
    paymentMap.set(method, payment);

    for (const item of order.items) {
      const key = item.menuItemId ?? `custom:${item.name.toLowerCase()}`;
      const seller = bestSellerMap.get(key) ?? {
        name: item.name,
        menuItemId: item.menuItemId,
        quantity: 0,
        salesCents: 0,
      };
      seller.quantity += item.quantity;
      seller.salesCents += item.lineTotalCents;
      bestSellerMap.set(key, seller);
    }
  }

  return {
    businessDay,
    salesCents,
    orderCount: orders.filter((order) => order.status !== 'cancelled').length,
    paidOrderCount,
    unpaidOrderCount: orders.filter((order) => order.status !== 'cancelled' && order.paymentStatus === 'unpaid').length,
    activeOrderCount: orders.filter((order) => isActiveOrderStatus(order.status)).length,
    cancelledOrderCount: orders.filter((order) => order.status === 'cancelled').length,
    averageOrderCents: paidOrderCount > 0 ? Math.round(salesCents / paidOrderCount) : 0,
    bestSellers: [...bestSellerMap.values()].sort((a, b) => b.quantity - a.quantity || b.salesCents - a.salesCents).slice(0, 8),
    paymentMethods: [...paymentMap.values()].sort((a, b) => b.salesCents - a.salesCents),
  };
}


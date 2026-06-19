import { parseMenuVariants } from '@shared/lib/menu/menu-variants';

export const RESTAURANT_ORDER_STATUSES = ['new', 'preparing', 'ready', 'completed', 'cancelled'] as const;
export const RESTAURANT_PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'] as const;
export const RESTAURANT_PAYMENT_METHODS = ['cash', 'card', 'swish', 'other'] as const;
export const RESTAURANT_FULFILLMENT_TYPES = ['takeaway', 'dine_in', 'counter', 'booking_linked', 'delivery'] as const;
export const PUBLIC_FULFILLMENT_TYPES = ['takeaway', 'delivery'] as const;
export const RESTAURANT_KOT_STATUSES = ['not_sent', 'sent', 'printed'] as const;

export type RestaurantOrderStatus = (typeof RESTAURANT_ORDER_STATUSES)[number];
export type RestaurantPaymentStatus = (typeof RESTAURANT_PAYMENT_STATUSES)[number];
export type RestaurantPaymentMethod = (typeof RESTAURANT_PAYMENT_METHODS)[number];
export type RestaurantFulfillmentType = (typeof RESTAURANT_FULFILLMENT_TYPES)[number];
export type PublicFulfillmentType = (typeof PUBLIC_FULFILLMENT_TYPES)[number];
export type RestaurantKotStatus = (typeof RESTAURANT_KOT_STATUSES)[number];
export type RestaurantOrderSource = 'portal' | 'public';
export type RestaurantBusinessDayStatus = 'open' | 'closed';

export interface RestaurantOrderModifierSelection {
  groupId: string | null;
  groupName: string;
  optionId: string | null;
  optionName: string;
  priceDeltaCents: number;
}

export interface RestaurantMenuVariantSnapshot {
  id: string | null;
  name: string;
  priceCents: number;
  isDefault: boolean;
  isAvailable: boolean;
  sortOrder: number;
}

export interface RestaurantMenuModifierOptionSnapshot {
  id: string | null;
  name: string;
  priceDeltaCents: number;
  isAvailable: boolean;
  sortOrder: number;
}

export interface RestaurantMenuModifierGroupSnapshot {
  id: string | null;
  name: string;
  minSelected: number;
  maxSelected: number;
  required: boolean;
  sortOrder: number;
  options: RestaurantMenuModifierOptionSnapshot[];
}

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
  variantName?: string | null;
  variantPriceCents?: number | null;
  selectedModifiers?: RestaurantOrderModifierSelection[];
  modifierTotalCents?: number;
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
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  tableLabel?: string | null;
  bookingReference?: string | null;
  note: string | null;
  subtotalCents: number;
  discountCents?: number;
  taxCents?: number;
  taxRateBps?: number;
  totalCents: number;
  currency: string;
  isHeld?: boolean;
  kotStatus?: RestaurantKotStatus;
  sentToKitchenAt?: string | null;
  printedAt?: string | null;
  printCount?: number;
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
  variantName?: string | null;
  variantPriceCents?: number | null;
  selectedModifiers?: RestaurantOrderModifierSelection[];
  modifierTotalCents?: number | null;
  unitPriceCents?: number | null;
  variantLabel?: string | null;
  note?: string | null;
}

export interface CreateRestaurantOrderInput {
  fulfillmentType?: RestaurantFulfillmentType;
  customerName?: string | null;
  tableLabel?: string | null;
  bookingReference?: string | null;
  note?: string | null;
  discountCents?: number | null;
  taxRateBps?: number | null;
  isHeld?: boolean;
  sendToKitchen?: boolean;
  printReceipt?: boolean;
  paymentStatus?: RestaurantPaymentStatus;
  paymentMethod?: RestaurantPaymentMethod | null;
  items: CreateRestaurantOrderItemInput[];
}

export interface UpdateRestaurantOrderInput {
  status?: RestaurantOrderStatus;
  paymentStatus?: RestaurantPaymentStatus;
  paymentMethod?: RestaurantPaymentMethod | null;
  fulfillmentType?: RestaurantFulfillmentType;
  customerName?: string | null;
  tableLabel?: string | null;
  bookingReference?: string | null;
  note?: string | null;
  isHeld?: boolean;
  kotStatus?: RestaurantKotStatus;
  printReceipt?: boolean;
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
  isAvailable?: boolean;
  tags?: string[];
  variants?: RestaurantMenuVariantSnapshot[];
  modifierGroups?: RestaurantMenuModifierGroupSnapshot[];
}

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
  variantName: string | null;
  variantPriceCents: number | null;
  selectedModifiers: RestaurantOrderModifierSelection[];
  modifierTotalCents: number;
  unitPriceCents: number;
  lineTotalCents: number;
  note: string | null;
  sortOrder: number;
}

export interface RestaurantOrderTotals {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  taxRateBps: number;
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

function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function priceInt(value: number | null | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(Number(value))) : 0;
}

function findSelectedVariant(
  item: CreateRestaurantOrderItemInput,
  menuItem: RestaurantMenuItemSnapshot | null,
): { name: string | null; priceCents: number | null } {
  if (!menuItem) {
    return {
      name: cleanText(item.variantName),
      priceCents: item.variantPriceCents === null || item.variantPriceCents === undefined
        ? null
        : priceInt(item.variantPriceCents),
    };
  }

  const variants = menuItem.variants ?? [];
  if (variants.length === 0) return { name: null, priceCents: null };
  const availableVariants = variants.filter((candidate) => candidate.isAvailable);
  const selectedName = cleanText(item.variantName);
  if (selectedName) {
    const variant = availableVariants.find((candidate) => candidate.name === selectedName);
    if (!variant) throw new Error(`Varianten "${selectedName}" är inte tillgänglig.`);
    return { name: variant.name, priceCents: variant.priceCents };
  }

  const variant = availableVariants.find((candidate) => candidate.isDefault) ?? availableVariants[0];

  return variant ? { name: variant.name, priceCents: variant.priceCents } : { name: null, priceCents: null };
}

function normalizeModifierSelections(
  input: RestaurantOrderModifierSelection[] | undefined,
  menuItem: RestaurantMenuItemSnapshot | null,
): RestaurantOrderModifierSelection[] {
  if (!input?.length) return [];
  if (!menuItem) {
    return input.map((selection) => ({
      groupId: cleanText(selection.groupId),
      groupName: cleanText(selection.groupName) ?? 'Tillval',
      optionId: cleanText(selection.optionId),
      optionName: cleanText(selection.optionName) ?? 'Tillval',
      priceDeltaCents: priceInt(selection.priceDeltaCents),
    })).filter((selection) => selection.optionName);
  }

  const selected: RestaurantOrderModifierSelection[] = [];
  for (const group of menuItem.modifierGroups ?? []) {
    const requested = input.filter((selection) => (
      (selection.groupId && selection.groupId === group.id)
      || selection.groupName === group.name
    ));
    const groupSelections: RestaurantOrderModifierSelection[] = [];
    for (const selection of requested) {
      const option = group.options.find((candidate) => (
        candidate.isAvailable
        && ((selection.optionId && selection.optionId === candidate.id) || selection.optionName === candidate.name)
      ));
      if (!option) continue;
      groupSelections.push({
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        priceDeltaCents: option.priceDeltaCents,
      });
    }
    selected.push(...groupSelections.slice(0, group.maxSelected));
  }
  return selected;
}

export function normalizeOrderItems(
  input: CreateRestaurantOrderItemInput[],
  menuItems: Map<string, RestaurantMenuItemSnapshot>,
): NormalizedOrderItem[] {
  return input.map((item, index) => {
    const menuItem = item.menuItemId ? menuItems.get(item.menuItemId) ?? null : null;
    const name = (menuItem?.name ?? item.name ?? '').trim();
    const quantity = Math.max(1, Math.floor(item.quantity));
    const variant = findSelectedVariant(item, menuItem);
    const selectedModifiers = normalizeModifierSelections(item.selectedModifiers, menuItem);
    const modifierTotalCents = selectedModifiers.reduce((sum, selection) => sum + selection.priceDeltaCents, 0)
      || (menuItem ? 0 : priceInt(item.modifierTotalCents));
    const basePriceCents = variant.priceCents ?? menuItem?.priceCents ?? (menuItem ? null : item.unitPriceCents ?? 0);
    if (basePriceCents === null) {
      throw new Error(`Menyvalet "${name || item.menuItemId || 'okänd rad'}" saknar ett tillgängligt pris.`);
    }
    const unitPriceCents = priceInt(basePriceCents) + modifierTotalCents;

    return {
      menuItemId: menuItem?.id ?? item.menuItemId ?? null,
      name,
      quantity,
      variantName: variant.name,
      variantPriceCents: variant.priceCents,
      selectedModifiers,
      modifierTotalCents,
      unitPriceCents,
      lineTotalCents: quantity * unitPriceCents,
      note: item.note?.trim() || null,
      sortOrder: index,
    };
  }).filter((item) => item.name);
}

/**
 * Variant-aware normalization for public online orders. Every line must reference an available menu
 * item; the price is taken from that item's own variants (parsed from the menu row), never from the
 * client. A line is dropped when the item is unknown/unavailable, resolves to no priced variant, or
 * names a size that does not exist.
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
      variantName: variant.label || null,
      variantPriceCents: variant.priceCents,
      selectedModifiers: [],
      modifierTotalCents: 0,
      unitPriceCents: variant.priceCents,
      lineTotalCents: quantity * variant.priceCents,
      note: item.note?.trim() || null,
      sortOrder: out.length,
    });
  }
  return out;
}

export function calculateOrderTotals(
  items: NormalizedOrderItem[],
  currency = 'SEK',
  input: { discountCents?: number | null; taxRateBps?: number | null } = {},
): RestaurantOrderTotals {
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const discountCents = Math.min(subtotalCents, priceInt(input.discountCents));
  const taxableCents = Math.max(0, subtotalCents - discountCents);
  const taxRateBps = Number.isFinite(input.taxRateBps) ? Math.max(0, Math.floor(Number(input.taxRateBps))) : 1200;
  const taxCents = taxRateBps > 0 ? Math.round((taxableCents * taxRateBps) / (10_000 + taxRateBps)) : 0;
  return {
    subtotalCents,
    discountCents,
    taxCents,
    taxRateBps,
    totalCents: taxableCents,
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


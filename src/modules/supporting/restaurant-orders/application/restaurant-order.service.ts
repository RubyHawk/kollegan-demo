import { Errors } from '@platform/api/errors';
import { logger } from '@platform/logging/logger';
import { tenantHasModule } from '@platform/tenancy/tenant-resolver';
import {
  assertOrderStatusTransition,
  buildOrderSummary,
  calculateOrderTotals,
  buildPublicOrderItems,
  normalizeOrderItems,
  type CloseBusinessDayInput,
  type CreatePublicRestaurantOrderInput,
  type CreateRestaurantOrderInput,
  type CreateRestaurantOrderItemInput,
  type ListRestaurantOrdersInput,
  type RestaurantOrderSummary,
  type RestaurantOrderView,
  type StartBusinessDayInput,
  type UpdateRestaurantOrderInput,
} from '../domain/restaurant-order.entity';
import { resolvePublicRestaurantOrganization } from '@modules/supporting/restaurant-menu';
import { restaurantOrderRepository } from '../infrastructure/restaurant-order.repository';

const TAG = 'RestaurantOrderService';
const RESTAURANT_TIME_ZONE = 'Europe/Stockholm';

async function requireOrdersModule(organizationId: string) {
  const enabled = await tenantHasModule(organizationId, 'restaurant_orders');
  if (!enabled) throw Errors.forbidden('Orders module is not enabled for this organization');
}

function stockholmDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: RESTAURANT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function timeZoneOffsetMs(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: RESTAURANT_TIME_ZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const hour = values.hour === '24' ? '00' : values.hour;
  const zonedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(hour),
    Number(values.minute),
    Number(values.second),
  );
  return zonedAsUtc - date.getTime();
}

function stockholmLocalDateTimeToUtc(year: number, month: number, day: number) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const firstOffset = timeZoneOffsetMs(utcGuess);
  const adjusted = new Date(utcGuess.getTime() - firstOffset);
  const finalOffset = timeZoneOffsetMs(adjusted);
  return new Date(utcGuess.getTime() - finalOffset);
}

function stockholmDayBounds(date: Date) {
  const { year, month, day } = stockholmDateParts(date);
  const start = stockholmLocalDateTimeToUtc(year, month, day);
  const nextStart = stockholmLocalDateTimeToUtc(year, month, day + 1);
  return { start, end: new Date(nextStart.getTime() - 1), nextStart };
}

function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function collectMenuItemIds(input: { items: CreateRestaurantOrderItemInput[] }): string[] {
  return Array.from(new Set(input.items.map((item) => item.menuItemId).filter((id): id is string => Boolean(id))));
}

export async function getCurrentBusinessDay(organizationId: string) {
  await requireOrdersModule(organizationId);
  return restaurantOrderRepository.getOpenBusinessDay(organizationId);
}

export async function startBusinessDay(
  organizationId: string,
  actorId: string,
  input: StartBusinessDayInput = {},
) {
  await requireOrdersModule(organizationId);
  const existing = await restaurantOrderRepository.getOpenBusinessDay(organizationId);
  if (existing) return existing;

  const { start } = stockholmDayBounds(new Date());
  const businessDay = await restaurantOrderRepository.startBusinessDay(
    organizationId,
    actorId,
    start,
    cleanText(input.openingNote),
  );
  logger.info(TAG, 'Business day started', { organizationId, actorId, businessDayId: businessDay.id });
  return businessDay;
}

export async function closeBusinessDay(
  organizationId: string,
  actorId: string,
  input: CloseBusinessDayInput = {},
) {
  await requireOrdersModule(organizationId);
  const businessDay = await restaurantOrderRepository.getOpenBusinessDay(organizationId);
  if (!businessDay) throw Errors.conflict('Ingen dag är startad.');

  const blocking = await restaurantOrderRepository.countBusinessDayBlockingOrders(organizationId, businessDay.id);
  if (blocking.activeCount > 0) throw Errors.conflict('Stäng aktiva ordrar innan dagen avslutas.');
  if (blocking.unpaidCount > 0) throw Errors.conflict('Hantera obetalda ordrar innan dagen avslutas.');

  const closed = await restaurantOrderRepository.closeBusinessDay(
    organizationId,
    businessDay.id,
    actorId,
    cleanText(input.closingNote),
  );
  if (!closed) throw Errors.notFound('Business day');
  logger.info(TAG, 'Business day closed', { organizationId, actorId, businessDayId: businessDay.id });
  return closed;
}

export async function listRestaurantOrders(
  organizationId: string,
  input: ListRestaurantOrdersInput = {},
) {
  await requireOrdersModule(organizationId);
  return restaurantOrderRepository.listOrders(organizationId, input);
}

export async function createRestaurantOrder(
  organizationId: string,
  actorId: string,
  input: CreateRestaurantOrderInput,
  options: { canMarkPaid: boolean },
): Promise<RestaurantOrderView> {
  await requireOrdersModule(organizationId);
  const businessDay = await restaurantOrderRepository.getOpenBusinessDay(organizationId);
  if (!businessDay) throw Errors.conflict('Starta dagen innan du tar första ordern.');
  if (input.paymentStatus === 'paid' && !options.canMarkPaid) {
    throw Errors.forbidden('Du får inte markera betalning.');
  }

  const menuItems = await restaurantOrderRepository.findMenuItemsByIds(organizationId, collectMenuItemIds(input));
  const menuMap = new Map(menuItems.map((item) => [item.id, item]));
  const items = normalizeOrderItems(input.items, menuMap);
  if (items.length === 0) throw Errors.validation('Ordern behöver minst en rad.');

  const currency = menuItems.find((item) => item.currency)?.currency ?? 'SEK';
  const totals = calculateOrderTotals(items, currency);
  const order = await restaurantOrderRepository.createOrder(organizationId, businessDay.id, actorId, {
    fulfillmentType: input.fulfillmentType ?? 'takeaway',
    customerName: cleanText(input.customerName),
    note: cleanText(input.note),
    paymentStatus: input.paymentStatus ?? 'unpaid',
    paymentMethod: input.paymentMethod ?? null,
    items,
    totals,
  });
  logger.info(TAG, 'Restaurant order created', { organizationId, actorId, orderId: order.id });
  return order;
}

/**
 * Customer-facing online order from the public website. No auth: the organization is resolved from
 * the request host (same resolver the public menu/reservation endpoints use). Prices are snapshotted
 * server-side from the live menu (client prices are ignored), unavailable items are dropped, and the
 * order is always created as `source: 'public'`, unpaid (pay on pickup/delivery). Online ordering is
 * open only while the kitchen's POS day is started, so orders actually reach the kitchen.
 */
export async function createPublicRestaurantOrder(
  host: string | null | undefined,
  input: CreatePublicRestaurantOrderInput,
) {
  const organizationId = await resolvePublicRestaurantOrganization(host);
  // Public online ordering is part of the public site: require it to be enabled (mirrors the public
  // menu/reservation flows) as well as the POS orders module, so a POS-only org with the public site
  // turned off does not accept external orders.
  const publicSiteEnabled = await tenantHasModule(organizationId, 'restaurant_public_site');
  if (!publicSiteEnabled) throw Errors.notFound('Restaurant site not found');
  await requireOrdersModule(organizationId);

  const customerName = cleanText(input.customerName);
  const customerPhone = cleanText(input.customerPhone);
  if (!customerName) throw Errors.validation('Namn krävs.');
  if (!customerPhone) throw Errors.validation('Telefonnummer krävs.');

  const deliveryAddress = input.fulfillmentType === 'delivery' ? cleanText(input.deliveryAddress) : null;
  if (input.fulfillmentType === 'delivery' && !deliveryAddress) {
    throw Errors.validation('Leveransadress krävs för leverans.');
  }

  const businessDay = await restaurantOrderRepository.getOpenBusinessDay(organizationId);
  if (!businessDay) throw Errors.conflict('Onlinebeställningar är stängda just nu. Ring oss så hjälper vi dig.');

  const menuItems = await restaurantOrderRepository.findMenuItemsByIds(organizationId, collectMenuItemIds(input));
  const menuMap = new Map(menuItems.map((item) => [item.id, item]));
  const items = buildPublicOrderItems(input.items, menuMap);
  if (items.length === 0) throw Errors.validation('Beställningen behöver minst en tillgänglig rad.');

  const currency = menuItems.find((item) => item.currency)?.currency ?? 'SEK';
  const totals = calculateOrderTotals(items, currency);
  const order = await restaurantOrderRepository.createOrder(organizationId, businessDay.id, null, {
    source: 'public',
    fulfillmentType: input.fulfillmentType,
    customerName,
    customerPhone,
    deliveryAddress,
    note: cleanText(input.note),
    paymentStatus: 'unpaid',
    paymentMethod: null,
    items,
    totals,
  });
  logger.info(TAG, 'Public restaurant order created', {
    organizationId,
    orderId: order.id,
    fulfillmentType: order.fulfillmentType,
  });
  return { orderNumber: order.orderNumber, status: order.status, fulfillmentType: order.fulfillmentType };
}

export async function updateRestaurantOrder(
  organizationId: string,
  orderId: string,
  actorId: string,
  input: UpdateRestaurantOrderInput,
  options: { canMarkPaid: boolean; canAdmin: boolean },
): Promise<RestaurantOrderView> {
  await requireOrdersModule(organizationId);
  const existing = await restaurantOrderRepository.getOrderById(organizationId, orderId);
  if (!existing) throw Errors.notFound('Restaurant order');

  if (input.paymentStatus !== undefined) {
    if (!options.canMarkPaid) throw Errors.forbidden('Du får inte ändra betalstatus.');
    if (input.paymentStatus === 'refunded' && !options.canAdmin) {
      throw Errors.forbidden('Endast ansvarig kan markera återbetalning.');
    }
  }

  if (input.status !== undefined) {
    if (input.status === 'cancelled' && !options.canAdmin) {
      throw Errors.forbidden('Endast ansvarig kan makulera ordrar.');
    }
    try {
      assertOrderStatusTransition(existing.status, input.status);
    } catch (err) {
      throw Errors.conflict((err as Error).message);
    }
  }

  const updated = await restaurantOrderRepository.updateOrder(organizationId, orderId, actorId, {
    ...input,
    customerName: input.customerName !== undefined ? cleanText(input.customerName) : undefined,
    note: input.note !== undefined ? cleanText(input.note) : undefined,
  });
  if (!updated) throw Errors.notFound('Restaurant order');
  logger.info(TAG, 'Restaurant order updated', { organizationId, actorId, orderId });
  return updated;
}

export async function getRestaurantOrderSummary(organizationId: string): Promise<RestaurantOrderSummary> {
  await requireOrdersModule(organizationId);
  const businessDay = await restaurantOrderRepository.getOpenBusinessDay(organizationId);
  const orders = businessDay
    ? await restaurantOrderRepository.listOrdersForSummary(organizationId, { businessDayId: businessDay.id })
    : await restaurantOrderRepository.listOrdersForSummary(organizationId, {
      from: stockholmDayBounds(new Date()).start.toISOString(),
      to: stockholmDayBounds(new Date()).end.toISOString(),
    });
  return buildOrderSummary(businessDay, orders);
}

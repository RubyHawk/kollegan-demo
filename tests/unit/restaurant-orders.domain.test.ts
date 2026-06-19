import { describe, expect, it } from 'vitest';
import {
  assertOrderStatusTransition,
  buildOrderSummary,
  buildPublicOrderItems,
  calculateOrderTotals,
  normalizeOrderItems,
  type RestaurantBusinessDayView,
  type RestaurantMenuItemSnapshot,
  type RestaurantOrderView,
} from '../../src/modules/supporting/restaurant-orders/domain/restaurant-order.entity';

const variantMenu = new Map<string, RestaurantMenuItemSnapshot>([
  ['pizza', { id: 'pizza', name: '1. Det enkla', priceCents: null, currency: 'SEK', isAvailable: true, tags: ['S 69', 'M 119', 'L 199'] }],
  ['cola', { id: 'cola', name: 'Läsk 33cl', priceCents: 2_500, currency: 'SEK', isAvailable: true, tags: [] }],
  ['soldout', { id: 'soldout', name: 'Skagenröra', priceCents: null, currency: 'SEK', isAvailable: false, tags: ['Liten 75'] }],
]);

const businessDay: RestaurantBusinessDayView = {
  id: 'day_1',
  organizationId: 'org_1',
  businessDate: '2026-06-18T00:00:00.000Z',
  status: 'open',
  openedBy: 'user_1',
  openedAt: '2026-06-18T08:00:00.000Z',
  closedBy: null,
  closedAt: null,
  openingNote: null,
  closingNote: null,
  createdAt: '2026-06-18T08:00:00.000Z',
  updatedAt: '2026-06-18T08:00:00.000Z',
};

function order(overrides: Partial<RestaurantOrderView> = {}): RestaurantOrderView {
  return {
    id: 'order_1',
    organizationId: 'org_1',
    businessDayId: 'day_1',
    orderNumber: 1,
    source: 'portal',
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    fulfillmentType: 'counter',
    customerName: null,
    customerPhone: null,
    deliveryAddress: null,
    note: null,
    subtotalCents: 12_000,
    totalCents: 12_000,
    currency: 'SEK',
    paidAt: '2026-06-18T08:05:00.000Z',
    completedAt: '2026-06-18T08:10:00.000Z',
    cancelledAt: null,
    createdBy: 'user_1',
    updatedBy: 'user_1',
    createdAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-18T08:10:00.000Z',
    items: [
      {
        id: 'item_1',
        menuItemId: 'menu_1',
        name: 'Kebabsub',
        quantity: 2,
        unitPriceCents: 6_000,
        lineTotalCents: 12_000,
        note: null,
        sortOrder: 0,
      },
    ],
    ...overrides,
  };
}

describe('restaurant order domain rules', () => {
  it('normalizes menu snapshots and calculates totals', () => {
    const menu = new Map([
      ['menu_1', { id: 'menu_1', name: 'Kebabsub', priceCents: 6_000, currency: 'SEK', isAvailable: true, tags: [] }],
    ]);

    const items = normalizeOrderItems([
      { menuItemId: 'menu_1', quantity: 2, unitPriceCents: 1, note: ' extra sås ' },
      { name: 'Fri rad', quantity: 1, unitPriceCents: 1_500 },
    ], menu);

    expect(items).toMatchObject([
      { menuItemId: 'menu_1', name: 'Kebabsub', quantity: 2, unitPriceCents: 6_000, lineTotalCents: 12_000, note: 'extra sås' },
      { menuItemId: null, name: 'Fri rad', quantity: 1, unitPriceCents: 1_500, lineTotalCents: 1_500 },
    ]);
    expect(calculateOrderTotals(items)).toEqual({
      subtotalCents: 13_500,
      totalCents: 13_500,
      currency: 'SEK',
    });
  });

  it('builds public order lines from menu variants, dropping unorderable lines', () => {
    const items = buildPublicOrderItems([
      { menuItemId: 'pizza', quantity: 2, variantLabel: 'M', unitPriceCents: 1 },
      { menuItemId: 'cola', quantity: 1 },
      { menuItemId: 'pizza', quantity: 1, variantLabel: 'XXL' }, // unknown size → dropped
      { menuItemId: 'soldout', quantity: 1, variantLabel: 'Liten' }, // unavailable → dropped
      { menuItemId: 'missing', quantity: 1 }, // unknown item → dropped
    ], variantMenu);

    expect(items).toEqual([
      { menuItemId: 'pizza', name: '1. Det enkla (M)', quantity: 2, unitPriceCents: 11_900, lineTotalCents: 23_800, note: null, sortOrder: 0 },
      { menuItemId: 'cola', name: 'Läsk 33cl', quantity: 1, unitPriceCents: 2_500, lineTotalCents: 2_500, note: null, sortOrder: 1 },
    ]);
    expect(calculateOrderTotals(items)).toEqual({ subtotalCents: 26_300, totalCents: 26_300, currency: 'SEK' });
  });

  it('allows active workflow transitions and blocks terminal rollback', () => {
    expect(() => assertOrderStatusTransition('new', 'preparing')).not.toThrow();
    expect(() => assertOrderStatusTransition('preparing', 'ready')).not.toThrow();
    expect(() => assertOrderStatusTransition('ready', 'completed')).not.toThrow();
    expect(() => assertOrderStatusTransition('completed', 'ready')).toThrow(/completed to ready/);
    expect(() => assertOrderStatusTransition('cancelled', 'new')).toThrow(/cancelled to new/);
  });

  it('builds daily sales summary from paid non-cancelled orders', () => {
    const summary = buildOrderSummary(businessDay, [
      order(),
      order({
        id: 'order_2',
        orderNumber: 2,
        status: 'ready',
        paymentStatus: 'unpaid',
        paymentMethod: null,
        totalCents: 8_000,
      }),
      order({
        id: 'order_3',
        orderNumber: 3,
        status: 'cancelled',
        paymentStatus: 'paid',
        totalCents: 6_000,
      }),
    ]);

    expect(summary.salesCents).toBe(12_000);
    expect(summary.orderCount).toBe(2);
    expect(summary.paidOrderCount).toBe(1);
    expect(summary.unpaidOrderCount).toBe(1);
    expect(summary.activeOrderCount).toBe(1);
    expect(summary.cancelledOrderCount).toBe(1);
    expect(summary.bestSellers[0]).toMatchObject({ name: 'Kebabsub', quantity: 2, salesCents: 12_000 });
    expect(summary.paymentMethods).toEqual([{ method: 'card', count: 1, salesCents: 12_000 }]);
  });
});

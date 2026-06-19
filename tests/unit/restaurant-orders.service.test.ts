import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@platform/tenancy/tenant-resolver', () => ({
  tenantHasModule: vi.fn(),
}));

vi.mock('@platform/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@modules/supporting/restaurant-menu', () => ({
  resolvePublicRestaurantOrganization: vi.fn(),
}));

vi.mock('../../src/modules/supporting/restaurant-orders/infrastructure/restaurant-order.repository', () => ({
  restaurantOrderRepository: {
    getOpenBusinessDay: vi.fn(),
    getBusinessDayById: vi.fn(),
    startBusinessDay: vi.fn(),
    closeBusinessDay: vi.fn(),
    findMenuItemsByIds: vi.fn(),
    createOrder: vi.fn(),
    getOrderById: vi.fn(),
    listOrders: vi.fn(),
    listOrdersForSummary: vi.fn(),
    countBusinessDayBlockingOrders: vi.fn(),
    updateOrder: vi.fn(),
  },
}));

import { tenantHasModule } from '@platform/tenancy/tenant-resolver';
import { resolvePublicRestaurantOrganization } from '@modules/supporting/restaurant-menu';
import {
  closeBusinessDay,
  createPublicRestaurantOrder,
  createRestaurantOrder,
  getRestaurantOrderSummary,
  startBusinessDay,
  updateRestaurantOrder,
} from '../../src/modules/supporting/restaurant-orders/application/restaurant-order.service';
import type {
  RestaurantBusinessDayView,
  RestaurantOrderView,
} from '../../src/modules/supporting/restaurant-orders/domain/restaurant-order.entity';
import { restaurantOrderRepository } from '../../src/modules/supporting/restaurant-orders/infrastructure/restaurant-order.repository';

const day: RestaurantBusinessDayView = {
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

const order: RestaurantOrderView = {
  id: 'order_1',
  organizationId: 'org_1',
  businessDayId: 'day_1',
  orderNumber: 1,
  source: 'portal',
  status: 'new',
  paymentStatus: 'unpaid',
  paymentMethod: null,
  fulfillmentType: 'counter',
  customerName: null,
  customerPhone: null,
  deliveryAddress: null,
  note: null,
  subtotalCents: 6_000,
  totalCents: 6_000,
  currency: 'SEK',
  paidAt: null,
  completedAt: null,
  cancelledAt: null,
  createdBy: 'user_1',
  updatedBy: 'user_1',
  createdAt: '2026-06-18T08:00:00.000Z',
  updatedAt: '2026-06-18T08:00:00.000Z',
  items: [],
};

describe('restaurant order service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenantHasModule).mockResolvedValue(true);
    vi.mocked(resolvePublicRestaurantOrganization).mockResolvedValue('org_1');
    vi.mocked(restaurantOrderRepository.getOpenBusinessDay).mockResolvedValue(day);
    vi.mocked(restaurantOrderRepository.findMenuItemsByIds).mockResolvedValue([
      { id: 'menu_1', name: 'Kebabsub', priceCents: 6_000, currency: 'SEK', isAvailable: true, tags: [] },
    ]);
    vi.mocked(restaurantOrderRepository.createOrder).mockResolvedValue(order);
    vi.mocked(restaurantOrderRepository.getOrderById).mockResolvedValue(order);
    vi.mocked(restaurantOrderRepository.listOrders).mockResolvedValue([]);
    vi.mocked(restaurantOrderRepository.listOrdersForSummary).mockResolvedValue([]);
    vi.mocked(restaurantOrderRepository.countBusinessDayBlockingOrders).mockResolvedValue({ activeCount: 0, unpaidCount: 0 });
    vi.mocked(restaurantOrderRepository.updateOrder).mockResolvedValue(order);
    vi.mocked(restaurantOrderRepository.closeBusinessDay).mockResolvedValue({ ...day, status: 'closed', closedAt: '2026-06-18T20:00:00.000Z' });
  });

  it('requires the restaurant orders module', async () => {
    vi.mocked(tenantHasModule).mockResolvedValue(false);

    await expect(startBusinessDay('org_1', 'user_1')).rejects.toMatchObject({
      problem: { status: 403 },
    });
    expect(restaurantOrderRepository.startBusinessDay).not.toHaveBeenCalled();
  });

  it('returns an existing open day when start day is called twice', async () => {
    await expect(startBusinessDay('org_1', 'user_1')).resolves.toEqual(day);
    expect(restaurantOrderRepository.startBusinessDay).not.toHaveBeenCalled();
  });

  it('requires an open business day before creating orders', async () => {
    vi.mocked(restaurantOrderRepository.getOpenBusinessDay).mockResolvedValue(null);

    await expect(createRestaurantOrder('org_1', 'user_1', {
      items: [{ menuItemId: 'menu_1', quantity: 1 }],
    }, { canMarkPaid: true })).rejects.toMatchObject({
      problem: { status: 409 },
    });
    expect(restaurantOrderRepository.createOrder).not.toHaveBeenCalled();
  });

  it('blocks marking an order paid without payment permission', async () => {
    await expect(createRestaurantOrder('org_1', 'user_1', {
      paymentStatus: 'paid',
      paymentMethod: 'card',
      items: [{ menuItemId: 'menu_1', quantity: 1 }],
    }, { canMarkPaid: false })).rejects.toMatchObject({
      problem: { status: 403 },
    });
    expect(restaurantOrderRepository.createOrder).not.toHaveBeenCalled();
  });

  it('prevents closing the day while active or unpaid orders remain', async () => {
    vi.mocked(restaurantOrderRepository.countBusinessDayBlockingOrders).mockResolvedValue({ activeCount: 1, unpaidCount: 0 });

    await expect(closeBusinessDay('org_1', 'manager_1')).rejects.toMatchObject({
      problem: { status: 409 },
    });
    expect(restaurantOrderRepository.closeBusinessDay).not.toHaveBeenCalled();
    expect(restaurantOrderRepository.listOrders).not.toHaveBeenCalled();
  });

  it('prevents closing the day while unpaid orders remain beyond the UI list cap', async () => {
    vi.mocked(restaurantOrderRepository.countBusinessDayBlockingOrders).mockResolvedValue({ activeCount: 0, unpaidCount: 1 });

    await expect(closeBusinessDay('org_1', 'manager_1')).rejects.toMatchObject({
      problem: { status: 409 },
    });
    expect(restaurantOrderRepository.closeBusinessDay).not.toHaveBeenCalled();
    expect(restaurantOrderRepository.listOrders).not.toHaveBeenCalled();
  });

  it('builds summaries from the uncapped summary query, not the UI list', async () => {
    vi.mocked(restaurantOrderRepository.listOrdersForSummary).mockResolvedValue([{ ...order, paymentStatus: 'paid' }]);

    await expect(getRestaurantOrderSummary('org_1')).resolves.toMatchObject({
      orderCount: 1,
      salesCents: 6_000,
    });
    expect(restaurantOrderRepository.listOrdersForSummary).toHaveBeenCalledWith('org_1', { businessDayId: 'day_1' });
    expect(restaurantOrderRepository.listOrders).not.toHaveBeenCalled();
  });

  it('requires admin permission to cancel an order', async () => {
    await expect(updateRestaurantOrder('org_1', 'order_1', 'user_1', {
      status: 'cancelled',
    }, { canMarkPaid: true, canAdmin: false })).rejects.toMatchObject({
      problem: { status: 403 },
    });
    expect(restaurantOrderRepository.updateOrder).not.toHaveBeenCalled();
  });

  it('requires admin permission to mark an order refunded', async () => {
    vi.mocked(restaurantOrderRepository.getOrderById).mockResolvedValue({ ...order, paymentStatus: 'paid' });

    await expect(updateRestaurantOrder('org_1', 'order_1', 'user_1', {
      paymentStatus: 'refunded',
    }, { canMarkPaid: true, canAdmin: false })).rejects.toMatchObject({
      problem: { status: 403 },
    });
    expect(restaurantOrderRepository.updateOrder).not.toHaveBeenCalled();
  });

  it('allows admins with payment permission to mark an order refunded', async () => {
    vi.mocked(restaurantOrderRepository.getOrderById).mockResolvedValue({ ...order, paymentStatus: 'paid' });
    vi.mocked(restaurantOrderRepository.updateOrder).mockResolvedValue({ ...order, paymentStatus: 'refunded' });

    await expect(updateRestaurantOrder('org_1', 'order_1', 'manager_1', {
      paymentStatus: 'refunded',
    }, { canMarkPaid: true, canAdmin: true })).resolves.toMatchObject({
      paymentStatus: 'refunded',
    });
    expect(restaurantOrderRepository.updateOrder).toHaveBeenCalledWith('org_1', 'order_1', 'manager_1', expect.objectContaining({
      paymentStatus: 'refunded',
    }));
  });

  it('blocks invalid terminal status transitions', async () => {
    vi.mocked(restaurantOrderRepository.getOrderById).mockResolvedValue({ ...order, status: 'completed' });

    await expect(updateRestaurantOrder('org_1', 'order_1', 'user_1', {
      status: 'ready',
    }, { canMarkPaid: true, canAdmin: true })).rejects.toMatchObject({
      problem: { status: 409 },
    });
    expect(restaurantOrderRepository.updateOrder).not.toHaveBeenCalled();
  });
});

describe('public restaurant order service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenantHasModule).mockResolvedValue(true);
    vi.mocked(resolvePublicRestaurantOrganization).mockResolvedValue('org_1');
    vi.mocked(restaurantOrderRepository.getOpenBusinessDay).mockResolvedValue(day);
    vi.mocked(restaurantOrderRepository.findMenuItemsByIds).mockResolvedValue([
      { id: 'menu_1', name: 'Kebabsub', priceCents: 6_000, currency: 'SEK', isAvailable: true, tags: [] },
    ]);
    vi.mocked(restaurantOrderRepository.createOrder).mockResolvedValue({ ...order, source: 'public' });
  });

  it('requires the public site module to be enabled (404)', async () => {
    vi.mocked(tenantHasModule).mockResolvedValue(false);
    await expect(createPublicRestaurantOrder('fluffys.se', {
      fulfillmentType: 'takeaway',
      customerName: 'Alex',
      customerPhone: '+46700000000',
      items: [{ menuItemId: 'menu_1', quantity: 1 }],
    })).rejects.toMatchObject({ problem: { status: 404 } });
    expect(restaurantOrderRepository.createOrder).not.toHaveBeenCalled();
  });

  it('rejects delivery without an address (400)', async () => {
    await expect(createPublicRestaurantOrder('fluffys.se', {
      fulfillmentType: 'delivery',
      customerName: 'Alex',
      customerPhone: '+46700000000',
      items: [{ menuItemId: 'menu_1', quantity: 1 }],
    })).rejects.toMatchObject({ problem: { status: 400 } });
    expect(restaurantOrderRepository.createOrder).not.toHaveBeenCalled();
  });

  it('rejects orders when no business day is open (409)', async () => {
    vi.mocked(restaurantOrderRepository.getOpenBusinessDay).mockResolvedValue(null);
    await expect(createPublicRestaurantOrder('fluffys.se', {
      fulfillmentType: 'takeaway',
      customerName: 'Alex',
      customerPhone: '+46700000000',
      items: [{ menuItemId: 'menu_1', quantity: 1 }],
    })).rejects.toMatchObject({ problem: { status: 409 } });
    expect(restaurantOrderRepository.createOrder).not.toHaveBeenCalled();
  });

  it('creates a public, unpaid order with server-snapshotted prices and a null actor', async () => {
    const result = await createPublicRestaurantOrder('fluffys.se', {
      fulfillmentType: 'takeaway',
      customerName: 'Alex',
      customerPhone: '+46700000000',
      items: [{ menuItemId: 'menu_1', quantity: 2, unitPriceCents: 1 }],
    });

    expect(result).toMatchObject({ orderNumber: 1 });
    expect(restaurantOrderRepository.createOrder).toHaveBeenCalledWith('org_1', 'day_1', null, expect.objectContaining({
      source: 'public',
      fulfillmentType: 'takeaway',
      customerName: 'Alex',
      customerPhone: '+46700000000',
      paymentStatus: 'unpaid',
      paymentMethod: null,
    }));
  });

  it('drops unavailable items and fails when nothing orderable remains (400)', async () => {
    vi.mocked(restaurantOrderRepository.findMenuItemsByIds).mockResolvedValue([
      { id: 'menu_1', name: 'Kebabsub', priceCents: 6_000, currency: 'SEK', isAvailable: false, tags: [] },
    ]);
    await expect(createPublicRestaurantOrder('fluffys.se', {
      fulfillmentType: 'takeaway',
      customerName: 'Alex',
      customerPhone: '+46700000000',
      items: [{ menuItemId: 'menu_1', quantity: 1 }],
    })).rejects.toMatchObject({ problem: { status: 400 } });
    expect(restaurantOrderRepository.createOrder).not.toHaveBeenCalled();
  });

  it('snapshots the chosen size price from the menu and ignores any client price', async () => {
    vi.mocked(restaurantOrderRepository.findMenuItemsByIds).mockResolvedValue([
      { id: 'menu_1', name: '1. Det enkla', priceCents: null, currency: 'SEK', isAvailable: true, tags: ['S 69', 'M 119', 'L 199'] },
    ]);

    await createPublicRestaurantOrder('fluffys.se', {
      fulfillmentType: 'takeaway',
      customerName: 'Alex',
      customerPhone: '+46700000000',
      items: [{ menuItemId: 'menu_1', quantity: 2, variantLabel: 'M', unitPriceCents: 1 }],
    });

    const input = vi.mocked(restaurantOrderRepository.createOrder).mock.calls[0]![3];
    expect(input.items).toHaveLength(1);
    expect(input.items[0]).toMatchObject({
      name: '1. Det enkla (M)',
      quantity: 2,
      unitPriceCents: 11_900,
      lineTotalCents: 23_800,
    });
  });

  it('rejects an order whose only line names a size that does not exist (400)', async () => {
    vi.mocked(restaurantOrderRepository.findMenuItemsByIds).mockResolvedValue([
      { id: 'menu_1', name: '1. Det enkla', priceCents: null, currency: 'SEK', isAvailable: true, tags: ['S 69', 'M 119'] },
    ]);
    await expect(createPublicRestaurantOrder('fluffys.se', {
      fulfillmentType: 'takeaway',
      customerName: 'Alex',
      customerPhone: '+46700000000',
      items: [{ menuItemId: 'menu_1', quantity: 1, variantLabel: 'XXL' }],
    })).rejects.toMatchObject({ problem: { status: 400 } });
    expect(restaurantOrderRepository.createOrder).not.toHaveBeenCalled();
  });
});

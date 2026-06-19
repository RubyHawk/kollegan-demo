import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@platform/tenancy/tenant-resolver', () => ({
  tenantHasModule: vi.fn(),
}));

vi.mock('@platform/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
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
import {
  closeBusinessDay,
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
    vi.mocked(restaurantOrderRepository.getOpenBusinessDay).mockResolvedValue(day);
    vi.mocked(restaurantOrderRepository.findMenuItemsByIds).mockResolvedValue([
      { id: 'menu_1', name: 'Kebabsub', priceCents: 6_000, currency: 'SEK' },
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

  it('blocks kitchen status changes while an order is held', async () => {
    vi.mocked(restaurantOrderRepository.getOrderById).mockResolvedValue({ ...order, isHeld: true });

    await expect(updateRestaurantOrder('org_1', 'order_1', 'user_1', {
      status: 'preparing',
    }, { canMarkPaid: true, canAdmin: true })).rejects.toMatchObject({
      problem: { status: 409 },
    });
    expect(restaurantOrderRepository.updateOrder).not.toHaveBeenCalled();
  });

  it('allows a held order to move when the same update sends it to the kitchen', async () => {
    vi.mocked(restaurantOrderRepository.getOrderById).mockResolvedValue({ ...order, isHeld: true });
    vi.mocked(restaurantOrderRepository.updateOrder).mockResolvedValue({
      ...order,
      status: 'preparing',
      isHeld: false,
      kotStatus: 'sent',
    });

    await expect(updateRestaurantOrder('org_1', 'order_1', 'user_1', {
      status: 'preparing',
      kotStatus: 'sent',
    }, { canMarkPaid: true, canAdmin: true })).resolves.toMatchObject({
      status: 'preparing',
      isHeld: false,
    });
    expect(restaurantOrderRepository.updateOrder).toHaveBeenCalledWith('org_1', 'order_1', 'user_1', expect.objectContaining({
      status: 'preparing',
      kotStatus: 'sent',
      isHeld: false,
    }));
  });
});

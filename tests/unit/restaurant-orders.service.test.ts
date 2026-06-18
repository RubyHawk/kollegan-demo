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
    updateOrder: vi.fn(),
  },
}));

import { tenantHasModule } from '@platform/tenancy/tenant-resolver';
import {
  closeBusinessDay,
  createRestaurantOrder,
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
    vi.mocked(restaurantOrderRepository.listOrders).mockResolvedValue([{ ...order, status: 'ready' }]);

    await expect(closeBusinessDay('org_1', 'manager_1')).rejects.toMatchObject({
      problem: { status: 409 },
    });
    expect(restaurantOrderRepository.closeBusinessDay).not.toHaveBeenCalled();
  });

  it('requires admin permission to cancel an order', async () => {
    await expect(updateRestaurantOrder('org_1', 'order_1', 'user_1', {
      status: 'cancelled',
    }, { canMarkPaid: true, canAdmin: false })).rejects.toMatchObject({
      problem: { status: 403 },
    });
    expect(restaurantOrderRepository.updateOrder).not.toHaveBeenCalled();
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

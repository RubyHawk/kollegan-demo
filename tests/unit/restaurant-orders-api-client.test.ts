import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  closeBusinessDay,
  createRestaurantOrder,
  getCurrentBusinessDay,
  getRestaurantOrderSummary,
  listRestaurantOrders,
  startBusinessDay,
  updateRestaurantOrder,
} from '../../src/shared/lib/api/restaurant-orders.api';

afterEach(() => {
  vi.restoreAllMocks();
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('restaurant orders API client', () => {
  it('uses v1 restaurant order routes for day, order, and summary actions', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ businessDay: { id: 'day_1', status: 'open' } }))
      .mockResolvedValueOnce(json({ businessDay: { id: 'day_1', status: 'open' } }, 201))
      .mockResolvedValueOnce(json({ orders: [] }))
      .mockResolvedValueOnce(json({ order: { id: 'order_1', orderNumber: 1 } }, 201))
      .mockResolvedValueOnce(json({ order: { id: 'order_1', paymentStatus: 'paid' } }))
      .mockResolvedValueOnce(json({ order: { id: 'order_1', paymentStatus: 'refunded' } }))
      .mockResolvedValueOnce(json({ summary: { salesCents: 6000, bestSellers: [] } }))
      .mockResolvedValueOnce(json({ businessDay: { id: 'day_1', status: 'closed' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getCurrentBusinessDay()).resolves.toMatchObject({ id: 'day_1' });
    await expect(startBusinessDay()).resolves.toMatchObject({ id: 'day_1' });
    await expect(listRestaurantOrders({ activeOnly: true, paymentStatus: 'unpaid' })).resolves.toEqual([]);
    await expect(createRestaurantOrder({
      paymentStatus: 'paid',
      paymentMethod: 'card',
      items: [{ menuItemId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 }],
    })).resolves.toMatchObject({ id: 'order_1' });
    await expect(updateRestaurantOrder('order_1', { paymentStatus: 'paid', paymentMethod: 'card' })).resolves.toMatchObject({ paymentStatus: 'paid' });
    await expect(updateRestaurantOrder('order_1', { paymentStatus: 'refunded', paymentMethod: 'card' })).resolves.toMatchObject({ paymentStatus: 'refunded' });
    await expect(getRestaurantOrderSummary()).resolves.toMatchObject({ salesCents: 6000 });
    await expect(closeBusinessDay()).resolves.toMatchObject({ status: 'closed' });

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v1/restaurant/orders/business-day', expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/restaurant/orders/business-day', expect.objectContaining({ method: 'POST' }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/v1/restaurant/orders?paymentStatus=unpaid&activeOnly=true', expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/v1/restaurant/orders', expect.objectContaining({ method: 'POST' }));
    expect(fetchMock).toHaveBeenNthCalledWith(5, '/api/v1/restaurant/orders/order_1', expect.objectContaining({ method: 'PATCH' }));
    expect(fetchMock).toHaveBeenNthCalledWith(6, '/api/v1/restaurant/orders/order_1', expect.objectContaining({ method: 'PATCH' }));
    expect(fetchMock).toHaveBeenNthCalledWith(7, '/api/v1/restaurant/orders/summary', expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(8, '/api/v1/restaurant/orders/business-day/close', expect.objectContaining({ method: 'PATCH' }));
  });
});

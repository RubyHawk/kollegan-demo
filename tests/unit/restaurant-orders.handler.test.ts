import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@platform/auth/vapi-auth', () => ({
  validateVapiAuth: vi.fn(),
}));

vi.mock('@platform/auth/jwt', () => ({
  verifyToken: vi.fn(),
  isTokenBlacklisted: vi.fn(),
  isUserBlacklisted: vi.fn(),
}));

vi.mock('@platform/cache/rate-limiter', () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock('@platform/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@platform/tenancy/tenant-resolver', () => ({
  resolveTenantByHost: vi.fn().mockResolvedValue(null),
}));

vi.mock('@modules/supporting/auth/application/rbac.service', () => ({
  hasPermission: vi.fn(),
}));

vi.mock('@modules/supporting/auth', () => ({
  hasPermission: vi.fn(),
}));

vi.mock('../../src/modules/supporting/restaurant-orders/application/restaurant-order.service', () => ({
  closeBusinessDay: vi.fn(),
  createRestaurantOrder: vi.fn(),
  getCurrentBusinessDay: vi.fn(),
  getRestaurantOrderSummary: vi.fn(),
  listRestaurantOrders: vi.fn(),
  startBusinessDay: vi.fn(),
  updateRestaurantOrder: vi.fn(),
}));

import { hasPermission as rbacHasPermission } from '@modules/supporting/auth/application/rbac.service';
import { hasPermission as authHasPermission } from '@modules/supporting/auth';
import {
  createRestaurantOrder,
  getRestaurantOrderSummary,
  listRestaurantOrders,
  updateRestaurantOrder,
} from '../../src/modules/supporting/restaurant-orders/application/restaurant-order.service';
import {
  handleCreateRestaurantOrder,
  handleGetRestaurantOrderSummary,
  handleListRestaurantOrders,
  handleUpdateRestaurantOrder,
} from '../../src/modules/supporting/restaurant-orders/api/handlers/restaurant-order.handler';
import {
  json,
  makeReq,
  resetApiHandlerMocks,
  verifyToken,
  type JWTPayload,
} from './api-handler.test-utils';

const order = {
  id: 'order_1',
  orderNumber: 12,
  paymentStatus: 'paid',
  status: 'new',
  items: [],
};

const summary = {
  salesCents: 12_000,
  orderCount: 2,
  bestSellers: [],
};

function authHeaders() {
  return { authorization: 'Bearer test.jwt.token' };
}

describe('restaurant order API handlers', () => {
  beforeEach(() => {
    resetApiHandlerMocks();
    vi.mocked(verifyToken).mockResolvedValue({
      sub: 'usr_1',
      orgId: 'org_1',
      roles: ['staff'],
      type: 'access',
    } as JWTPayload);
    vi.mocked(rbacHasPermission).mockResolvedValue(true);
    vi.mocked(authHasPermission).mockResolvedValue(true);
    vi.mocked(listRestaurantOrders).mockResolvedValue([order] as never);
    vi.mocked(createRestaurantOrder).mockResolvedValue(order as never);
    vi.mocked(updateRestaurantOrder).mockResolvedValue({ ...order, paymentStatus: 'refunded' } as never);
    vi.mocked(getRestaurantOrderSummary).mockResolvedValue(summary as never);
  });

  it('lists orders through the v1 handler with org scope and active filters', async () => {
    const res = await handleListRestaurantOrders(makeReq({
      method: 'GET',
      url: 'http://localhost/api/v1/restaurant/orders?paymentStatus=unpaid&activeOnly=true',
      headers: authHeaders(),
      contentType: null,
    }));
    const body = await json(res) as { data: { orders: unknown[] } };

    expect(res.status).toBe(200);
    expect(body.data.orders).toHaveLength(1);
    expect(listRestaurantOrders).toHaveBeenCalledWith('org_1', {
      paymentStatus: 'unpaid',
      activeOnly: true,
    });
  });

  it('creates counter orders with payment permission flags from auth', async () => {
    const payload = {
      fulfillmentType: 'counter',
      note: 'Ingen lök',
      paymentStatus: 'paid',
      paymentMethod: 'card',
      items: [{ name: 'Kebabsub', quantity: 1, unitPriceCents: 9_500, note: 'Extra sås' }],
    };

    const res = await handleCreateRestaurantOrder(makeReq({
      method: 'POST',
      url: 'http://localhost/api/v1/restaurant/orders',
      headers: authHeaders(),
      body: payload,
    }));
    const body = await json(res) as { data: { order: { id: string } } };

    expect(res.status).toBe(201);
    expect(res.headers.get('Location')).toBe('/api/v1/restaurant/orders/order_1');
    expect(body.data.order.id).toBe('order_1');
    expect(createRestaurantOrder).toHaveBeenCalledWith('org_1', 'usr_1', payload, { canMarkPaid: true, canAdmin: true });
  });

  it('updates order payment state with payment and admin flags', async () => {
    const res = await handleUpdateRestaurantOrder(makeReq({
      method: 'PATCH',
      url: 'http://localhost/api/v1/restaurant/orders/order_1',
      headers: authHeaders(),
      body: { paymentStatus: 'refunded', paymentMethod: 'card' },
    }));

    expect(res.status).toBe(200);
    expect(updateRestaurantOrder).toHaveBeenCalledWith('org_1', 'order_1', 'usr_1', {
      paymentStatus: 'refunded',
      paymentMethod: 'card',
    }, { canMarkPaid: true, canAdmin: true });
  });

  it('accepts held-order item replacement payloads through the update handler', async () => {
    const payload = {
      items: [{
        menuItemId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 2,
        selectedModifiers: [{
          groupId: 'sas',
          groupName: 'Sås',
          optionId: 'vitlok',
          optionName: 'Vitlök',
          priceDeltaCents: 1000,
        }],
      }],
      discountCents: 0,
      taxRateBps: 1200,
      isHeld: true,
      kotStatus: 'not_sent',
    };

    const res = await handleUpdateRestaurantOrder(makeReq({
      method: 'PATCH',
      url: 'http://localhost/api/v1/restaurant/orders/order_1',
      headers: authHeaders(),
      body: payload,
    }));

    expect(res.status).toBe(200);
    expect(updateRestaurantOrder).toHaveBeenCalledWith('org_1', 'order_1', 'usr_1', payload, { canMarkPaid: true, canAdmin: true });
  });

  it('returns summary from the authenticated organization only', async () => {
    const res = await handleGetRestaurantOrderSummary(makeReq({
      method: 'GET',
      url: 'http://localhost/api/v1/restaurant/orders/summary',
      headers: authHeaders(),
      contentType: null,
    }));
    const body = await json(res) as { data: { summary: { salesCents: number } } };

    expect(res.status).toBe(200);
    expect(body.data.summary.salesCents).toBe(12_000);
    expect(getRestaurantOrderSummary).toHaveBeenCalledWith('org_1');
  });

  it('rejects order handlers when the JWT has no organization context', async () => {
    vi.mocked(verifyToken).mockResolvedValue({
      sub: 'usr_1',
      roles: ['staff'],
      type: 'access',
    } as JWTPayload);

    const res = await handleListRestaurantOrders(makeReq({
      method: 'GET',
      url: 'http://localhost/api/v1/restaurant/orders',
      headers: authHeaders(),
      contentType: null,
    }));

    expect(res.status).toBe(403);
    expect(listRestaurantOrders).not.toHaveBeenCalledWith('org_1', expect.anything());
  });
});

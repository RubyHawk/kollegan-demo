import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'node:crypto';

vi.mock('@platform/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../src/modules/supporting/restaurant-orders/infrastructure/restaurant-order.repository', () => ({
  restaurantOrderRepository: { markPublicOrderPaid: vi.fn() },
}));

vi.mock('../../src/modules/supporting/restaurant-orders/application/payment/swish-provider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/modules/supporting/restaurant-orders/application/payment/swish-provider')>();
  return { ...actual, getSwishPayment: vi.fn(), createSwishPayment: vi.fn() };
});

import {
  availableOnlineProviders,
  stripeConfig,
  swishConfig,
} from '../../src/modules/supporting/restaurant-orders/application/payment/payment-config';
import { verifyStripeEvent } from '../../src/modules/supporting/restaurant-orders/application/payment/stripe-provider';
import {
  getSwishPayment,
  orderIdFromSwishReference,
  swishReference,
} from '../../src/modules/supporting/restaurant-orders/application/payment/swish-provider';
import {
  confirmStripeWebhook,
  confirmSwishCallback,
} from '../../src/modules/supporting/restaurant-orders/application/payment/payment.service';
import { restaurantOrderRepository } from '../../src/modules/supporting/restaurant-orders/infrastructure/restaurant-order.repository';

const ORIGINAL_ENV = process.env;

function clearPaymentEnv() {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.SWISH_PAYEE_ALIAS;
  delete process.env.SWISH_CERT;
  delete process.env.SWISH_KEY;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  clearPaymentEnv();
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe('online payment gating', () => {
  it('is off by default (no providers configured)', () => {
    expect(stripeConfig()).toBeNull();
    expect(swishConfig()).toBeNull();
    expect(availableOnlineProviders()).toEqual([]);
  });

  it('enables card once Stripe keys are present', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_x';
    expect(stripeConfig()).not.toBeNull();
    expect(availableOnlineProviders()).toContain('card');
  });

  it('enables swish once Swish alias + cert are present', () => {
    process.env.SWISH_PAYEE_ALIAS = '1231111111';
    process.env.SWISH_CERT = 'cert';
    process.env.SWISH_KEY = 'key';
    expect(swishConfig()).not.toBeNull();
    expect(availableOnlineProviders()).toContain('swish');
  });
});

describe('swish reference round-trip', () => {
  it('encodes an order id to a Swish-safe reference and back', () => {
    const id = '11111111-2222-4333-8444-555555555555';
    const ref = swishReference(id);
    expect(ref).toMatch(/^[0-9A-F]{32}$/);
    expect(orderIdFromSwishReference(ref)).toBe(id);
    expect(orderIdFromSwishReference('not-a-ref')).toBeNull();
  });
});

describe('verifyStripeEvent', () => {
  function sign(payload: string, secret: string, t = Math.floor(Date.now() / 1000)) {
    const sig = crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
    return `t=${t},v1=${sig}`;
  }

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  it('accepts a valid signature and rejects tampering or a wrong secret', () => {
    const payload = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_1' } } });
    expect(verifyStripeEvent(payload, sign(payload, 'whsec_test'))?.type).toBe('checkout.session.completed');
    expect(verifyStripeEvent(`${payload} `, sign(payload, 'whsec_test'))).toBeNull();
    expect(verifyStripeEvent(payload, sign(payload, 'wrong_secret'))).toBeNull();
    expect(verifyStripeEvent(payload, null)).toBeNull();
  });

  it('rejects an expired timestamp', () => {
    const payload = '{}';
    const stale = Math.floor(Date.now() / 1000) - 10_000;
    expect(verifyStripeEvent(payload, sign(payload, 'whsec_test', stale))).toBeNull();
  });
});

describe('confirmStripeWebhook', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  function signed(object: Record<string, unknown>) {
    const payload = JSON.stringify({ type: 'checkout.session.completed', data: { object } });
    const t = Math.floor(Date.now() / 1000);
    const sig = crypto.createHmac('sha256', 'whsec_test').update(`${t}.${payload}`).digest('hex');
    return { payload, header: `t=${t},v1=${sig}` };
  }

  it('marks the order paid from a valid completed session', async () => {
    vi.mocked(restaurantOrderRepository.markPublicOrderPaid).mockResolvedValue('paid');
    const { payload, header } = signed({ id: 'cs_1', payment_status: 'paid', amount_total: 20_000, metadata: { orderId: 'order_1' } });
    await expect(confirmStripeWebhook(payload, header)).resolves.toBe(true);
    expect(restaurantOrderRepository.markPublicOrderPaid).toHaveBeenCalledWith('order_1', 'card', 20_000);
  });

  it('rejects an invalid signature and marks nothing', async () => {
    const { payload } = signed({ id: 'cs_1', payment_status: 'paid', metadata: { orderId: 'order_1' } });
    await expect(confirmStripeWebhook(payload, 't=1,v1=deadbeef')).resolves.toBe(false);
    expect(restaurantOrderRepository.markPublicOrderPaid).not.toHaveBeenCalled();
  });
});

describe('confirmSwishCallback', () => {
  it('re-verifies the status via Swish before marking the order paid', async () => {
    const orderId = '11111111-2222-4333-8444-555555555555';
    vi.mocked(getSwishPayment).mockResolvedValue({ status: 'PAID', amount: 200, payeePaymentReference: swishReference(orderId) });
    vi.mocked(restaurantOrderRepository.markPublicOrderPaid).mockResolvedValue('paid');

    await confirmSwishCallback({ id: 'swish_1', payeePaymentReference: 'X', status: 'PAID', amount: 999, currency: 'SEK' });

    expect(getSwishPayment).toHaveBeenCalledWith('swish_1');
    expect(restaurantOrderRepository.markPublicOrderPaid).toHaveBeenCalledWith(orderId, 'swish', 20_000);
  });

  it('does not mark paid when the re-verified status is not PAID', async () => {
    vi.mocked(getSwishPayment).mockResolvedValue({ status: 'DECLINED', amount: 200, payeePaymentReference: swishReference('11111111-2222-4333-8444-555555555555') });
    await confirmSwishCallback({ id: 'swish_2', payeePaymentReference: 'X', status: 'PAID', amount: 200, currency: 'SEK' });
    expect(restaurantOrderRepository.markPublicOrderPaid).not.toHaveBeenCalled();
  });
});

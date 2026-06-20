// Online payment orchestration for public orders. Creates a provider payment for an order and
// reconciles provider webhooks back to the order (marking it paid). The provider only ever sees the
// order id (in metadata / payeePaymentReference); prices come from the server-built order totals.

import { logger } from '@platform/logging/logger';
import { restaurantOrderRepository } from '../../infrastructure/restaurant-order.repository';
import { createStripeCheckout, verifyStripeEvent } from './stripe-provider';
import { createSwishPayment, getSwishPayment, orderIdFromSwishReference, type SwishCallback } from './swish-provider';
import { isProviderEnabled, type OnlinePaymentProvider } from './payment-config';

const TAG = 'RestaurantPayment';

export interface PayableOrder {
  id: string;
  orderNumber: number;
  currency: string;
  totalCents: number;
  customerPhone: string | null;
  items: Array<{ name: string; quantity: number; unitPriceCents: number }>;
}

export interface OnlinePaymentResult {
  provider: OnlinePaymentProvider;
  /** Stripe hosted checkout URL to redirect to. */
  redirectUrl?: string;
  /** Swish app-switch / QR token. */
  swishToken?: string | null;
}

export async function createOnlinePayment(params: {
  order: PayableOrder;
  provider: OnlinePaymentProvider;
  origin: string;
}): Promise<OnlinePaymentResult> {
  const { order, provider, origin } = params;
  if (!isProviderEnabled(provider)) throw new Error(`Payment provider "${provider}" is not enabled`);

  if (provider === 'card') {
    const session = await createStripeCheckout({
      orderId: order.id,
      orderNumber: order.orderNumber,
      currency: order.currency,
      lineItems: order.items.map((item) => ({
        name: item.name,
        unitAmountCents: item.unitPriceCents,
        quantity: item.quantity,
      })),
      successUrl: `${origin}/bestall/klar?order=${order.orderNumber}`,
      cancelUrl: `${origin}/bestall`,
      customerPhone: order.customerPhone,
    });
    return { provider: 'card', redirectUrl: session.url };
  }

  const swish = await createSwishPayment({
    orderId: order.id,
    amountCents: order.totalCents,
    currency: order.currency,
    callbackUrl: `${origin}/api/v1/webhooks/swish`,
    message: `Order ${order.orderNumber}`,
  });
  return { provider: 'swish', swishToken: swish.paymentRequestToken };
}

export async function confirmStripeWebhook(rawBody: string, signature: string | null): Promise<boolean> {
  const event = verifyStripeEvent(rawBody, signature);
  if (!event) {
    logger.warn(TAG, 'Stripe webhook rejected: invalid signature');
    return false;
  }
  if (event.type !== 'checkout.session.completed') return true;

  const session = event.data.object;
  if (session.payment_status !== 'paid') return true;
  const orderId = session.metadata?.orderId ?? session.client_reference_id ?? null;
  if (!orderId) return true;
  await markOrderPaid(orderId, 'card', session.amount_total ?? null);
  return true;
}

export async function confirmSwishCallback(callback: SwishCallback): Promise<boolean> {
  // Do not trust the callback body (the callback endpoint is unauthenticated): re-fetch the
  // authoritative status from Swish over mutual TLS before marking anything paid.
  const verified = callback.id ? await getSwishPayment(callback.id) : null;
  if (!verified || verified.status !== 'PAID') return true;
  const orderId = orderIdFromSwishReference(verified.payeePaymentReference ?? callback.payeePaymentReference ?? '');
  if (!orderId) return true;
  await markOrderPaid(orderId, 'swish', Math.round((verified.amount ?? 0) * 100));
  return true;
}

async function markOrderPaid(orderId: string, method: 'card' | 'swish', amountCents: number | null) {
  const result = await restaurantOrderRepository.markPublicOrderPaid(orderId, method, amountCents);
  switch (result) {
    case 'paid':
      logger.info(TAG, 'Order marked paid via webhook', { orderId, method });
      return;
    case 'already_paid':
      logger.info(TAG, 'Paid webhook for already-paid order (idempotent no-op)', { orderId });
      return;
    case 'amount_mismatch':
      logger.warn(TAG, 'Paid webhook amount mismatch — ignored', { orderId, amountCents });
      return;
    case 'not_found':
      logger.warn(TAG, 'Paid webhook for unknown public order — ignored', { orderId });
      return;
  }
}

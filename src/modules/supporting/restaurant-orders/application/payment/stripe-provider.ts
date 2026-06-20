// Stripe Checkout adapter — REST + Node crypto only (no SDK dependency). Creates a hosted Checkout
// Session for an order and verifies the webhook signature. The order id travels in the session
// metadata/client_reference_id so the webhook can reconcile without storing a provider reference.

import crypto from 'node:crypto';
import { stripeConfig } from './payment-config';

const STRIPE_API = 'https://api.stripe.com/v1/checkout/sessions';
const SIGNATURE_TOLERANCE_SECONDS = 300;

export interface StripeLineItem {
  name: string;
  unitAmountCents: number;
  quantity: number;
}

export interface StripeCheckoutResult {
  sessionId: string;
  url: string;
}

export async function createStripeCheckout(params: {
  orderId: string;
  orderNumber: number;
  currency: string;
  lineItems: StripeLineItem[];
  successUrl: string;
  cancelUrl: string;
  customerPhone?: string | null;
}): Promise<StripeCheckoutResult> {
  const config = stripeConfig();
  if (!config) throw new Error('Stripe is not configured');

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('success_url', params.successUrl);
  form.set('cancel_url', params.cancelUrl);
  form.set('client_reference_id', params.orderId);
  form.set('metadata[orderId]', params.orderId);
  form.set('metadata[orderNumber]', String(params.orderNumber));
  const currency = params.currency.toLowerCase();
  params.lineItems.forEach((item, index) => {
    form.set(`line_items[${index}][quantity]`, String(item.quantity));
    form.set(`line_items[${index}][price_data][currency]`, currency);
    form.set(`line_items[${index}][price_data][unit_amount]`, String(item.unitAmountCents));
    form.set(`line_items[${index}][price_data][product_data][name]`, item.name);
  });

  const res = await fetch(STRIPE_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });

  if (!res.ok) {
    throw new Error(`Stripe checkout session failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { id: string; url: string | null };
  if (!json.url) throw new Error('Stripe checkout session returned no URL');
  return { sessionId: json.id, url: json.url };
}

export interface StripeCheckoutSession {
  id: string;
  client_reference_id: string | null;
  amount_total: number | null;
  currency: string | null;
  payment_status: string | null;
  metadata: Record<string, string> | null;
}

export interface StripeEvent {
  type: string;
  data: { object: StripeCheckoutSession };
}

// Verifies the `Stripe-Signature` header (HMAC-SHA256 over `${timestamp}.${rawBody}`) with a constant-
// time compare and a replay tolerance window. Returns the parsed event, or null if invalid/untrusted.
export function verifyStripeEvent(rawBody: string, signatureHeader: string | null): StripeEvent | null {
  const config = stripeConfig();
  if (!config || !signatureHeader) return null;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((segment) => {
      const idx = segment.indexOf('=');
      return [segment.slice(0, idx).trim(), segment.slice(idx + 1).trim()];
    }),
  ) as Record<string, string>;

  const timestamp = parts.t;
  const provided = parts.v1;
  if (!timestamp || !provided) return null;

  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) return null;

  const expected = crypto
    .createHmac('sha256', config.webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as StripeEvent;
  } catch {
    return null;
  }
}

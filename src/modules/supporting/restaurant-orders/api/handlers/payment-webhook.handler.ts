// Public payment webhooks. These are plain handlers (not createHandler) because they must read the
// raw request body to verify the provider signature before trusting anything. Both are idempotent and
// always reconcile through the amount-guarded, source='public' repository update.

import { NextResponse, type NextRequest } from 'next/server';
import { logger } from '@platform/logging/logger';
import { confirmStripeWebhook, confirmSwishCallback } from '../../application/payment/payment.service';
import type { SwishCallback } from '../../application/payment/swish-provider';

const TAG = 'PaymentWebhook';

export async function handleStripeWebhook(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');
  try {
    const ok = await confirmStripeWebhook(rawBody, signature);
    if (!ok) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error(TAG, 'Stripe webhook processing failed', { error: (err as Error).message });
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }
}

export async function handleSwishWebhook(req: NextRequest): Promise<NextResponse> {
  let body: SwishCallback;
  try {
    body = (await req.json()) as SwishCallback;
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  try {
    await confirmSwishCallback(body);
    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error(TAG, 'Swish callback processing failed', { error: (err as Error).message });
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }
}

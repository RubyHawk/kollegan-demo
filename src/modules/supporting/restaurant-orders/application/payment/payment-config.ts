// Env-gated online payment configuration. Online payment is OFF unless a provider is configured, so
// the public checkout falls back to pay-on-arrival until keys/certs exist. No secrets live in the repo:
// Stripe uses STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET; Swish uses a payee alias + client certificate.

export type OnlinePaymentProvider = 'card' | 'swish';

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
}

export interface SwishConfig {
  baseUrl: string;
  payeeAlias: string;
  /** PEM client certificate + key for Swish mutual TLS, and optional CA. */
  cert: string;
  key: string;
  ca: string | null;
}

export function stripeConfig(): StripeConfig | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) return null;
  return { secretKey, webhookSecret };
}

export function swishConfig(): SwishConfig | null {
  const payeeAlias = process.env.SWISH_PAYEE_ALIAS;
  const cert = process.env.SWISH_CERT;
  const key = process.env.SWISH_KEY;
  if (!payeeAlias || !cert || !key) return null;
  return {
    baseUrl: process.env.SWISH_BASE_URL || 'https://cpc.getswish.net/swish-cpcapi',
    payeeAlias,
    cert,
    key,
    ca: process.env.SWISH_CA || null,
  };
}

export function availableOnlineProviders(): OnlinePaymentProvider[] {
  const providers: OnlinePaymentProvider[] = [];
  if (stripeConfig()) providers.push('card');
  if (swishConfig()) providers.push('swish');
  return providers;
}

export function onlinePaymentEnabled(): boolean {
  return availableOnlineProviders().length > 0;
}

export function isProviderEnabled(provider: OnlinePaymentProvider): boolean {
  return availableOnlineProviders().includes(provider);
}

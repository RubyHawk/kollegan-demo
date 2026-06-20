// Swish Commerce adapter — REST over mutual TLS via Node https (no SDK). Creates an m-commerce payment
// request; Swish posts the result to our callback. The order id (dashes stripped) is the
// payeePaymentReference so the callback can be reconciled without storing a provider reference.

import https from 'node:https';
import crypto from 'node:crypto';
import { swishConfig } from './payment-config';

export interface SwishPaymentResult {
  paymentId: string;
  /** Token used to app-switch to Swish / render a QR on the client. */
  paymentRequestToken: string | null;
}

// Swish payeePaymentReference must be [A-Za-z0-9], length 1–35. A dash-stripped uuid is 32 hex chars.
export function swishReference(orderId: string): string {
  return orderId.replace(/-/g, '').slice(0, 35).toUpperCase();
}

export function orderIdFromSwishReference(reference: string): string | null {
  const hex = reference.toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function createSwishPayment(params: {
  orderId: string;
  amountCents: number;
  currency: string;
  callbackUrl: string;
  message: string;
}): Promise<SwishPaymentResult> {
  const config = swishConfig();
  if (!config) throw new Error('Swish is not configured');

  const instructionId = crypto.randomUUID().replace(/-/g, '').toUpperCase();
  const payload = JSON.stringify({
    payeePaymentReference: swishReference(params.orderId),
    callbackUrl: params.callbackUrl,
    payeeAlias: config.payeeAlias,
    currency: params.currency.toUpperCase(),
    amount: (params.amountCents / 100).toFixed(2),
    message: params.message.slice(0, 50),
  });

  const url = new URL(`${config.baseUrl}/api/v2/paymentrequests/${instructionId}`);
  return new Promise<SwishPaymentResult>((resolve, reject) => {
    const request = https.request(
      {
        method: 'PUT',
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        cert: config.cert,
        key: config.key,
        ca: config.ca ?? undefined,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode === 201) {
            const location = res.headers.location;
            const token = (res.headers.paymentrequesttoken as string | undefined) ?? null;
            const paymentId = typeof location === 'string' ? (location.split('/').pop() ?? instructionId) : instructionId;
            resolve({ paymentId, paymentRequestToken: token });
          } else {
            reject(new Error(`Swish payment request failed (${res.statusCode}): ${data}`));
          }
        });
      },
    );
    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

export interface SwishCallback {
  id: string;
  payeePaymentReference: string;
  status: string;
  amount: number;
  currency: string;
}

export interface SwishPaymentStatus {
  status: string;
  amount: number;
  payeePaymentReference: string;
}

// Re-fetches the authoritative payment status from Swish over mutual TLS. Used to verify callbacks
// instead of trusting the (unauthenticated) callback body. Returns null when unconfigured or on error.
export async function getSwishPayment(paymentId: string): Promise<SwishPaymentStatus | null> {
  const config = swishConfig();
  if (!config) return null;
  const url = new URL(`${config.baseUrl}/api/v1/paymentrequests/${paymentId}`);
  return new Promise<SwishPaymentStatus | null>((resolve) => {
    const request = https.request(
      {
        method: 'GET',
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        cert: config.cert,
        key: config.key,
        ca: config.ca ?? undefined,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) return resolve(null);
          try {
            const json = JSON.parse(data) as { status: string; amount: number | string; payeePaymentReference: string };
            resolve({ status: json.status, amount: Number(json.amount), payeePaymentReference: json.payeePaymentReference });
          } catch {
            resolve(null);
          }
        });
      },
    );
    request.on('error', () => resolve(null));
    request.end();
  });
}

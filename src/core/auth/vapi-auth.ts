import { NextRequest } from 'next/server';
import { logger } from '@core/logging/logger';

const SECRET = process.env.VAPI_WEBHOOK_SECRET;

/**
 * Validates the x-vapi-secret header sent by VAPI on every tool call.
 *
 * Returns null if the request is authenticated.
 * Returns an error object if authentication fails.
 *
 * Behaviour:
 * - Production: VAPI_WEBHOOK_SECRET MUST be set; missing secret → 500
 * - Development: If secret is not configured, logs a warning and allows through
 */
export function validateVapiAuth(req: NextRequest): { error: string; status: number } | null {
  if (!SECRET) {
    if (process.env.NODE_ENV === 'production') {
      return {
        error: 'Server misconfigured: VAPI_WEBHOOK_SECRET environment variable not set',
        status: 500,
      };
    }
    logger.warn('vapi-auth', 'VAPI_WEBHOOK_SECRET not set — skipping auth check (dev mode only)');
    return null;
  }

  const header = req.headers.get('x-vapi-secret');
  if (!header || header !== SECRET) {
    return { error: 'Unauthorized', status: 401 };
  }

  return null;
}

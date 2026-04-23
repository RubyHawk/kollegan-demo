import { vi } from 'vitest';
import { NextRequest } from 'next/server';
import { validateVapiAuth } from '@platform/auth/vapi-auth';
import {
  verifyToken,
  isTokenBlacklisted,
  isUserBlacklisted,
  type JWTPayload,
} from '@platform/auth/jwt';
import { checkRateLimit, type RateLimitResult } from '@platform/cache/rate-limiter';

export const VAPI_SECRET = 'test-secret';

export function makeReq(opts: {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
  contentType?: string | null;
} = {}): NextRequest {
  const {
    method = 'POST',
    url = 'http://localhost/api/test',
    body,
    headers = {},
    contentType = 'application/json',
  } = opts;

  const reqHeaders: Record<string, string> = { ...headers };
  if (contentType !== null) reqHeaders['content-type'] = contentType;

  return new NextRequest(url, {
    method,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function json(res: Response): Promise<unknown> {
  return res.json();
}

export function resetApiHandlerMocks(): void {
  vi.clearAllMocks();

  vi.mocked(validateVapiAuth).mockReturnValue(null);
  vi.mocked(verifyToken).mockResolvedValue(
    { sub: 'usr_test', role: 'receptionist', type: 'access' } as JWTPayload
  );
  vi.mocked(isTokenBlacklisted).mockResolvedValue(false);
  vi.mocked(isUserBlacklisted).mockResolvedValue(false);
  vi.mocked(checkRateLimit).mockResolvedValue({
    allowed: true,
    remaining: 59,
    resetAt: Date.now() + 60_000,
  } satisfies RateLimitResult);

  process.env.VAPI_WEBHOOK_SECRET = VAPI_SECRET;
}

export {
  validateVapiAuth,
  verifyToken,
  isTokenBlacklisted,
  isUserBlacklisted,
  checkRateLimit,
  type JWTPayload,
  type RateLimitResult,
};

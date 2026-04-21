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

import { createHandler } from '@platform/api/handler';
import { Errors } from '@platform/api/errors';
import { ok } from '@platform/api/response';
import {
  checkRateLimit,
  json,
  makeReq,
  resetApiHandlerMocks,
  type RateLimitResult,
} from './api-handler.test-utils';

beforeEach(() => {
  resetApiHandlerMocks();
});

describe('API handler rate limiting', () => {
  it('returns 429 with standard and legacy RateLimit headers when throttled', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 47_000,
    } satisfies RateLimitResult);

    const handler = createHandler(
      { tag: 'Test', auth: 'none', rateLimit: { max: 10, windowMs: 60_000 } },
      async () => ok({})
    );
    const res = await handler(makeReq({ method: 'GET', contentType: null }));
    const body = await json(res) as Record<string, unknown>;

    expect(res.status).toBe(429);
    expect(res.headers.get('content-type')).toContain('application/problem+json');
    expect(res.headers.get('RateLimit-Limit')).toBe('10');
    expect(res.headers.get('RateLimit-Remaining')).toBe('0');
    expect(res.headers.get('RateLimit-Reset')).toMatch(/^\d+$/);
    expect(res.headers.get('Retry-After')).toMatch(/^\d+$/);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(res.headers.get('X-RateLimit-Reset')).toMatch(/^\d+$/);

    expect(body).toMatchObject({
      status: 429,
      retryable: true,
      retryAfter: expect.any(Number),
    });
  });

  it('passes through when rate limit is not exceeded', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetAt: Date.now() + 60_000,
    } satisfies RateLimitResult);
    const handler = createHandler(
      { tag: 'Test', auth: 'none', rateLimit: { max: 10, windowMs: 60_000 } },
      async () => ok({ ok: true })
    );
    const res = await handler(makeReq({ method: 'GET', contentType: null }));
    expect(res.status).toBe(200);
  });

  it('skips rate limiting when rateLimit: false', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none', rateLimit: false },
      async () => ok({})
    );
    const res = await handler(makeReq({ method: 'GET', contentType: null }));
    expect(res.status).toBe(200);
    expect(vi.mocked(checkRateLimit)).not.toHaveBeenCalled();
  });
});

describe('API handler ApiError propagation', () => {
  it('propagates thrown ApiError into RFC 9457 Problem Details response', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => { throw Errors.notFound('Booking #abc'); }
    );
    const res = await handler(makeReq({ method: 'GET', contentType: null }));
    const body = await json(res) as Record<string, unknown>;

    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/problem+json');
    expect(body).toMatchObject({
      type: expect.stringContaining('not-found'),
      title: 'Not Found',
      status: 404,
      detail: 'Booking #abc was not found',
      retryable: false,
    });
  });

  it('attaches requestId and instance to every Problem response', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => { throw Errors.conflict('Room 101 is already locked'); }
    );
    const res = await handler(makeReq({ method: 'POST', body: {} }));
    const body = await json(res) as Record<string, unknown>;

    expect(body).toMatchObject({
      requestId: expect.stringMatching(/^req_/),
      instance: '/api/test',
    });
  });

  it('methodNotAllowed emits Allow header', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => { throw Errors.methodNotAllowed(['GET', 'POST']); }
    );
    const res = await handler(makeReq({ method: 'DELETE', contentType: null }));
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET, POST');
  });

  it('Retry-After header present on retryable errors', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => { throw Errors.unavailable(); }
    );
    const res = await handler(makeReq({ method: 'GET', contentType: null }));
    expect(res.status).toBe(503);
    expect(res.headers.get('Retry-After')).toBe('30');

    const body = await json(res) as Record<string, unknown>;
    expect(body).toMatchObject({ retryable: true, retryAfter: 30 });
  });

  it('badGateway is retryable with retryAfter', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => { throw Errors.badGateway(); }
    );
    const res = await handler(makeReq({ method: 'GET', contentType: null }));
    const body = await json(res) as Record<string, unknown>;
    expect(res.status).toBe(502);
    expect(body).toMatchObject({ retryable: true, retryAfter: 5 });
    expect(res.headers.get('Retry-After')).toBe('5');
  });

  it('gone(resource) produces 410 with correct detail', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => { throw Errors.gone('Invoice #7'); }
    );
    const res = await handler(makeReq({ method: 'GET', contentType: null }));
    const body = await json(res) as Record<string, unknown>;
    expect(res.status).toBe(410);
    expect(body).toMatchObject({ detail: 'Invoice #7 has been permanently removed', retryable: false });
  });
});

describe('API handler unknown error guard', () => {
  it('catches unhandled throw and returns 500 without exposing internals', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => { throw new Error('SELECT * FROM users WHERE 1=1; DROP TABLE users'); }
    );
    const res = await handler(makeReq({ method: 'GET', contentType: null }));
    const body = await json(res) as Record<string, unknown>;
    const text = JSON.stringify(body);

    expect(res.status).toBe(500);
    expect(text).not.toContain('DROP TABLE');
    expect(text).not.toContain('SELECT');
    expect(body).toMatchObject({ status: 500, retryable: true });
  });

  it('catches unhandled non-Error throw', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => { throw 'a string was thrown'; }
    );
    const res = await handler(makeReq({ method: 'GET', contentType: null }));
    expect(res.status).toBe(500);
  });
});

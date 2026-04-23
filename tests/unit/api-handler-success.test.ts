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
import { created, noContent, ok, paginated } from '@platform/api/response';
import { Errors } from '@platform/api/errors';
import { json, makeReq, resetApiHandlerMocks } from './api-handler.test-utils';

beforeEach(() => {
  resetApiHandlerMocks();
});

describe('API handler success envelope', () => {
  it('wraps handler return value in { data, meta } envelope', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'vapi' },
      async () => ok({ hello: 'world' })
    );

    const res = await handler(makeReq());
    const body = await json(res) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(body).toMatchObject({
      data: { hello: 'world' },
      meta: {
        requestId: expect.stringMatching(/^req_/),
        version: '2025-11-01',
        timestamp: expect.any(String),
        durationMs: expect.any(Number),
      },
    });
  });

  it('returns 200 for ok()', async () => {
    const handler = createHandler({ tag: 'Test', auth: 'none' }, async () => ok({ id: 1 }));
    const res = await handler(makeReq({ method: 'GET', contentType: null }));
    expect(res.status).toBe(200);
  });

  it('returns 201 for created() with Location header', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => created({ id: 'wf_1' }, '/api/v1/workflows/wf_1')
    );
    const res = await handler(makeReq({ method: 'POST', body: {} }));

    expect(res.status).toBe(201);
    expect(res.headers.get('Location')).toBe('/api/v1/workflows/wf_1');
  });

  it('returns 201 without Location when omitted', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => created({ id: 'wf_2' })
    );
    const res = await handler(makeReq({ method: 'POST', body: {} }));
    expect(res.status).toBe(201);
    expect(res.headers.get('Location')).toBeNull();
  });

  it('returns 204 for noContent()', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => noContent()
    );
    const res = await handler(makeReq({ method: 'DELETE', contentType: null }));
    expect(res.status).toBe(204);
  });

  it('attaches observability headers on every success response', async () => {
    const handler = createHandler({ tag: 'Test', auth: 'none' }, async () => ok({}));
    const res = await handler(makeReq({ method: 'GET', contentType: null }));

    expect(res.headers.get('X-Request-Id')).toMatch(/^req_/);
    expect(res.headers.get('X-Version')).toBe('2025-11-01');
    expect(res.headers.get('X-Duration-Ms')).toMatch(/^\d+$/);
  });

  it('includes pagination in envelope when paginated()', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => paginated([1, 2, 3], { count: 3, hasNext: true, hasPrev: false, nextCursor: 'cur_x' })
    );
    const res = await handler(makeReq({ method: 'GET', contentType: null }));
    const body = await json(res) as Record<string, unknown>;

    expect(body).toMatchObject({
      data: [1, 2, 3],
      pagination: { count: 3, hasNext: true, nextCursor: 'cur_x' },
    });
  });
});

describe('API handler envelope invariants', () => {
  it('success response always has "data" key, never "type" key', async () => {
    const handler = createHandler({ tag: 'Test', auth: 'none' }, async () => ok({ value: 42 }));
    const body = await json(await handler(makeReq({ method: 'GET', contentType: null }))) as Record<string, unknown>;
    expect('data' in body).toBe(true);
    expect('type' in body).toBe(false);
  });

  it('error response always has "type" key, never "data" key', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => { throw Errors.notFound('Thing'); }
    );
    const body = await json(await handler(makeReq({ method: 'GET', contentType: null }))) as Record<string, unknown>;
    expect('type' in body).toBe(true);
    expect('data' in body).toBe(false);
  });

  it('meta.durationMs is a non-negative number', async () => {
    const handler = createHandler({ tag: 'Test', auth: 'none' }, async () => ok({}));
    const body = await json(await handler(makeReq({ method: 'GET', contentType: null }))) as { meta: { durationMs: number } };
    expect(body.meta.durationMs).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(body.meta.durationMs)).toBe(true);
  });
});

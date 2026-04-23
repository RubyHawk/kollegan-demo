import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';

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
import { ok } from '@platform/api/response';
import { json, makeReq, resetApiHandlerMocks } from './api-handler.test-utils';

beforeEach(() => {
  resetApiHandlerMocks();
});

describe('API handler body validation', () => {
  const BodySchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().int().positive().optional(),
  });

  const handler = createHandler(
    { tag: 'Test', auth: 'none', body: BodySchema },
    async ({ body }) => ok({ received: body })
  );

  it('accepts a valid body', async () => {
    const res = await handler(makeReq({ body: { name: 'Alice', email: 'alice@example.com' } }));
    expect(res.status).toBe(200);
    const body = await json(res) as Record<string, unknown>;
    expect((body.data as Record<string, unknown>).received).toMatchObject({
      name: 'Alice',
      email: 'alice@example.com',
    });
  });

  it('returns 400 with RFC 9457 Problem Details on validation failure', async () => {
    const res = await handler(makeReq({ body: { name: '', email: 'not-an-email' } }));
    const body = await json(res) as Record<string, unknown>;

    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('application/problem+json');
    expect(body).toMatchObject({
      type: expect.stringContaining('validation-error'),
      title: 'Validation Error',
      status: 400,
      retryable: false,
    });
  });

  it('validation errors use JSON Pointer format', async () => {
    const res = await handler(makeReq({ body: { name: '', email: 'bad' } }));
    const body = await json(res) as { errors?: Array<{ pointer: string; detail: string; code: string }> };

    expect(Array.isArray(body.errors)).toBe(true);
    body.errors!.forEach((issue) => {
      expect(issue.pointer).toMatch(/^#/);
      expect(typeof issue.detail).toBe('string');
      expect(typeof issue.code).toBe('string');
    });
    const emailIssue = body.errors!.find((e) => e.pointer === '#/email');
    expect(emailIssue).toBeDefined();
  });

  it('returns 400 when body is not valid JSON', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json {{{',
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });
});

describe('API handler query string validation', () => {
  const QuerySchema = z.object({
    check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: z.enum(['Enkel', 'Dubbel', 'Svit']).optional(),
  });

  const handler = createHandler(
    { tag: 'Test', auth: 'none', query: QuerySchema },
    async ({ query }) => ok({ query })
  );

  it('parses valid query params', async () => {
    const req = makeReq({
      method: 'GET',
      contentType: null,
      url: 'http://localhost/api/test?check_in=2026-03-01&check_out=2026-03-05',
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await json(res) as Record<string, unknown>;
    expect((body.data as Record<string, unknown>).query).toMatchObject({
      check_in: '2026-03-01',
      check_out: '2026-03-05',
    });
  });

  it('returns 400 with pointer to invalid query field', async () => {
    const req = makeReq({
      method: 'GET',
      contentType: null,
      url: 'http://localhost/api/test?check_in=bad-date&check_out=2026-03-05',
    });
    const res = await handler(req);
    const body = await json(res) as { errors?: Array<{ pointer: string }> };

    expect(res.status).toBe(400);
    const issue = body.errors?.find((e) => e.pointer === '#/check_in');
    expect(issue).toBeDefined();
  });
});

describe('API handler content type validation', () => {
  const handler = createHandler(
    { tag: 'Test', auth: 'none', body: z.object({ x: z.string() }) },
    async () => ok({})
  );

  it('returns 415 when Content-Type is text/plain for a body route', async () => {
    const res = await handler(makeReq({ body: { x: 'y' }, contentType: 'text/plain' }));
    expect(res.status).toBe(415);
    const body = await json(res) as Record<string, unknown>;
    expect(body).toMatchObject({ status: 415, type: expect.stringContaining('unsupported-media-type') });
  });

  it('returns 415 when Content-Type is missing for a body route', async () => {
    const res = await handler(makeReq({ body: { x: 'y' }, contentType: null }));
    expect(res.status).toBe(415);
  });

  it('accepts application/json;charset=utf-8', async () => {
    const res = await handler(makeReq({ body: { x: 'y' }, contentType: 'application/json;charset=utf-8' }));
    expect(res.status).not.toBe(415);
  });

  it('does not require Content-Type for GET without a body schema', async () => {
    const getHandler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => ok({ ok: true })
    );
    const res = await getHandler(makeReq({ method: 'GET', contentType: null }));
    expect(res.status).toBe(200);
  });
});

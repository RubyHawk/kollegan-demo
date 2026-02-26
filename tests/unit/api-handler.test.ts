/**
 * Integration tests for createHandler — the core API middleware pipeline.
 *
 * Tests every middleware layer independently so we can catch regressions
 * in the contract without spinning up a server.
 *
 * Strategy: directly call the handler function returned by createHandler
 * with a mocked NextRequest, then assert on the NextResponse.
 *
 * RFC compliance assertions are explicitly labelled (e.g. RFC 9110 §15.5.2)
 * so that when an RFC changes we know exactly what to update.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// ─── Mocks (hoisted so vi.mock factory runs before imports) ────────────────────

vi.mock('@core/auth/vapi-auth', () => ({
  validateVapiAuth: vi.fn(),
}));

vi.mock('@core/auth/jwt', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@core/cache/rate-limiter', () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock('@core/logging/logger', () => ({
  logger: {
    info:  vi.fn(),
    warn:  vi.fn(),
    error: vi.fn(),
  },
}));

// ─── Imports (after mocks) ─────────────────────────────────────────────────────

import { createHandler } from '@core/api/handler';
import { ok, created, paginated, noContent } from '@core/api/response';
import { Errors } from '@core/api/errors';
import { validateVapiAuth } from '@core/auth/vapi-auth';
import { verifyToken, type JWTPayload } from '@core/auth/jwt';
import { checkRateLimit, type RateLimitResult } from '@core/cache/rate-limiter';

// ─── Test helpers ──────────────────────────────────────────────────────────────

const VAPI_SECRET = 'test-secret';

/** Build a NextRequest. Defaults: POST, application/json, valid VAPI secret. */
function makeReq(opts: {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
  contentType?: string | null;
} = {}): NextRequest {
  const {
    method      = 'POST',
    url         = 'http://localhost/api/test',
    body,
    headers     = {},
    contentType = 'application/json',
  } = opts;

  const reqHeaders: Record<string, string> = { ...headers };
  if (contentType !== null) reqHeaders['content-type'] = contentType;

  return new NextRequest(url, {
    method,
    headers: reqHeaders,
    body:    body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/** Parse the NextResponse body as JSON. */
async function json(res: Response): Promise<unknown> {
  return res.json();
}

// ─── Mock defaults (reset each test) ──────────────────────────────────────────

beforeEach(() => {
  // Clear call history so assertions like not.toHaveBeenCalled() only
  // see calls from the current test, not accumulated from previous ones.
  vi.clearAllMocks();

  vi.mocked(validateVapiAuth).mockReturnValue(null);            // auth OK
  vi.mocked(verifyToken).mockResolvedValue(                     // JWT OK — minimal valid payload
    { sub: 'usr_test', role: 'receptionist', type: 'access' } as JWTPayload
  );
  vi.mocked(checkRateLimit).mockResolvedValue({                 // not throttled
    allowed: true, remaining: 59, resetAt: Date.now() + 60_000,
  } satisfies RateLimitResult);
  process.env.VAPI_WEBHOOK_SECRET = VAPI_SECRET;
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. Happy path — success envelope
// ══════════════════════════════════════════════════════════════════════════════

describe('Happy path — success envelope', () => {
  it('wraps handler return value in { data, meta } envelope', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'vapi' },
      async () => ok({ hello: 'world' })
    );

    const res  = await handler(makeReq());
    const body = await json(res) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(body).toMatchObject({
      data: { hello: 'world' },
      meta: {
        requestId: expect.stringMatching(/^req_/),
        version:   '2025-11-01',
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

  it('returns 201 for created() with Location header (RFC 9110 §15.3.2)', async () => {
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
    const res  = await handler(makeReq({ method: 'GET', contentType: null }));
    const body = await json(res) as Record<string, unknown>;

    expect(body).toMatchObject({
      data: [1, 2, 3],
      pagination: { count: 3, hasNext: true, nextCursor: 'cur_x' },
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. VAPI authentication
// ══════════════════════════════════════════════════════════════════════════════

describe('Auth: vapi strategy', () => {
  it('allows request when validateVapiAuth returns null', async () => {
    vi.mocked(validateVapiAuth).mockReturnValue(null);
    const handler = createHandler({ tag: 'Test', auth: 'vapi' }, async () => ok({ ok: true }));
    const res = await handler(makeReq());
    expect(res.status).toBe(200);
  });

  it('returns 401 with WWW-Authenticate when auth fails (RFC 9110 §15.5.2)', async () => {
    vi.mocked(validateVapiAuth).mockReturnValue({ status: 401 } as never);
    const handler = createHandler({ tag: 'Test', auth: 'vapi' }, async () => ok({}));
    const res = await handler(makeReq());

    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toContain('application/problem+json');
    // RFC 9110 §15.5.2 MUST
    expect(res.headers.get('WWW-Authenticate')).toMatch(/ApiKey realm=/);

    const body = await json(res) as Record<string, unknown>;
    expect(body).toMatchObject({
      status:    401,
      retryable: false,
    });
  });

  it('returns 500 when auth misconfiguration detected (status 500 from validateVapiAuth)', async () => {
    vi.mocked(validateVapiAuth).mockReturnValue({ status: 500 } as never);
    const handler = createHandler({ tag: 'Test', auth: 'vapi' }, async () => ok({}));
    const res = await handler(makeReq());
    expect(res.status).toBe(500);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. JWT authentication
// ══════════════════════════════════════════════════════════════════════════════

describe('Auth: jwt strategy', () => {
  it('allows request with valid Bearer token', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ sub: 'usr_1', role: 'receptionist', type: 'access' } as JWTPayload);
    const handler = createHandler({ tag: 'Test', auth: 'jwt' }, async () => ok({ ok: true }));
    const res = await handler(makeReq({
      headers: { authorization: 'Bearer valid.jwt.token' },
    }));
    expect(res.status).toBe(200);
  });

  it('returns 401 with Bearer WWW-Authenticate when no token (RFC 9110 §15.5.2)', async () => {
    const handler = createHandler({ tag: 'Test', auth: 'jwt' }, async () => ok({}));
    const res = await handler(makeReq({ headers: {} })); // no Authorization header
    expect(res.status).toBe(401);
    // RFC 9110 §15.5.2 MUST — scheme must be Bearer for JWT strategy
    expect(res.headers.get('WWW-Authenticate')).toMatch(/Bearer realm=/);
  });

  it('returns 401 when token verification fails', async () => {
    vi.mocked(verifyToken).mockRejectedValue(new Error('expired'));
    const handler = createHandler({ tag: 'Test', auth: 'jwt' }, async () => ok({}));
    const res = await handler(makeReq({
      headers: { authorization: 'Bearer bad.token.here' },
    }));
    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Body validation (Zod schema)
// ══════════════════════════════════════════════════════════════════════════════

describe('Body validation', () => {
  const BodySchema = z.object({
    name:  z.string().min(1),
    email: z.string().email(),
    age:   z.number().int().positive().optional(),
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
      name: 'Alice', email: 'alice@example.com',
    });
  });

  it('returns 400 with RFC 9457 Problem Details on validation failure', async () => {
    const res  = await handler(makeReq({ body: { name: '', email: 'not-an-email' } }));
    const body = await json(res) as Record<string, unknown>;

    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('application/problem+json');
    expect(body).toMatchObject({
      type:    expect.stringContaining('validation-error'),
      title:   'Validation Error',
      status:  400,
      retryable: false,
    });
  });

  it('validation errors use JSON Pointer format (RFC 9457 §3 / RFC 6901)', async () => {
    const res  = await handler(makeReq({ body: { name: '', email: 'bad' } }));
    const body = await json(res) as { errors?: Array<{ pointer: string; detail: string; code: string }> };

    expect(Array.isArray(body.errors)).toBe(true);
    // Every issue must have a pointer starting with '#'
    body.errors!.forEach((issue) => {
      expect(issue.pointer).toMatch(/^#/);
      expect(typeof issue.detail).toBe('string');
      expect(typeof issue.code).toBe('string');
    });
    // Specifically: email field → '#/email'
    const emailIssue = body.errors!.find(e => e.pointer === '#/email');
    expect(emailIssue).toBeDefined();
  });

  it('returns 400 when body is not valid JSON', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    'not json {{{',
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Query string validation
// ══════════════════════════════════════════════════════════════════════════════

describe('Query string validation', () => {
  const QuerySchema = z.object({
    check_in:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type:      z.enum(['Enkel', 'Dubbel', 'Svit']).optional(),
  });

  const handler = createHandler(
    { tag: 'Test', auth: 'none', query: QuerySchema },
    async ({ query }) => ok({ query })
  );

  it('parses valid query params', async () => {
    const req = makeReq({ method: 'GET', contentType: null, url: 'http://localhost/api/test?check_in=2026-03-01&check_out=2026-03-05' });
    const res  = await handler(req);
    expect(res.status).toBe(200);
    const body = await json(res) as Record<string, unknown>;
    expect((body.data as Record<string, unknown>).query).toMatchObject({ check_in: '2026-03-01', check_out: '2026-03-05' });
  });

  it('returns 400 with pointer to invalid query field', async () => {
    const req  = makeReq({ method: 'GET', contentType: null, url: 'http://localhost/api/test?check_in=bad-date&check_out=2026-03-05' });
    const res  = await handler(req);
    const body = await json(res) as { errors?: Array<{ pointer: string }> };

    expect(res.status).toBe(400);
    const issue = body.errors?.find(e => e.pointer === '#/check_in');
    expect(issue).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Content-Type guard (RFC 9110 §15.5.15)
// ══════════════════════════════════════════════════════════════════════════════

describe('Content-Type validation (RFC 9110 §15.5.15)', () => {
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

  it('accepts application/json;charset=utf-8 (charset suffix)', async () => {
    const res = await handler(makeReq({ body: { x: 'y' }, contentType: 'application/json;charset=utf-8' }));
    // Body validation runs after CT check — if it passes CT check body may succeed
    expect(res.status).not.toBe(415);
  });

  it('does NOT require Content-Type for GET (no body schema)', async () => {
    const getHandler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => ok({ ok: true })
    );
    const res = await getHandler(makeReq({ method: 'GET', contentType: null }));
    expect(res.status).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Rate limiting
// ══════════════════════════════════════════════════════════════════════════════

describe('Rate limiting', () => {
  it('returns 429 with standard + legacy RateLimit headers when throttled', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 47_000 } satisfies RateLimitResult);

    const handler = createHandler(
      { tag: 'Test', auth: 'none', rateLimit: { max: 10, windowMs: 60_000 } },
      async () => ok({})
    );
    const res  = await handler(makeReq({ method: 'GET', contentType: null }));
    const body = await json(res) as Record<string, unknown>;

    expect(res.status).toBe(429);
    expect(res.headers.get('content-type')).toContain('application/problem+json');

    // Standard headers (IETF draft-ietf-httpapi-ratelimit-headers)
    expect(res.headers.get('RateLimit-Limit')).toBe('10');
    expect(res.headers.get('RateLimit-Remaining')).toBe('0');
    expect(res.headers.get('RateLimit-Reset')).toMatch(/^\d+$/);
    expect(res.headers.get('Retry-After')).toMatch(/^\d+$/);

    // Legacy X- headers (backward compat)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(res.headers.get('X-RateLimit-Reset')).toMatch(/^\d+$/);

    expect(body).toMatchObject({
      status:    429,
      retryable: true,
      retryAfter: expect.any(Number),
    });
  });

  it('passes through when rate limit is not exceeded', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60_000 } satisfies RateLimitResult);
    const handler = createHandler(
      { tag: 'Test', auth: 'none', rateLimit: { max: 10, windowMs: 60_000 } },
      async () => ok({ ok: true })
    );
    const res = await handler(makeReq({ method: 'GET', contentType: null }));
    expect(res.status).toBe(200);
  });

  it('skips rate limiting when rateLimit: false', async () => {
    // Even if checkRateLimit is called it wouldn't deny — but it shouldn't be called at all
    const handler = createHandler(
      { tag: 'Test', auth: 'none', rateLimit: false },
      async () => ok({})
    );
    const res = await handler(makeReq({ method: 'GET', contentType: null }));
    expect(res.status).toBe(200);
    expect(vi.mocked(checkRateLimit)).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. ApiError propagation
// ══════════════════════════════════════════════════════════════════════════════

describe('ApiError propagation', () => {
  it('propagates thrown ApiError into RFC 9457 Problem Details response', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => { throw Errors.notFound('Booking #abc'); }
    );
    const res  = await handler(makeReq({ method: 'GET', contentType: null }));
    const body = await json(res) as Record<string, unknown>;

    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/problem+json');
    expect(body).toMatchObject({
      type:      expect.stringContaining('not-found'),
      title:     'Not Found',
      status:    404,
      detail:    'Booking #abc was not found',
      retryable: false,
    });
  });

  it('attaches requestId and instance to every Problem response', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => { throw Errors.conflict('Room 101 is already locked'); }
    );
    const res  = await handler(makeReq({ method: 'POST', body: {} }));
    const body = await json(res) as Record<string, unknown>;

    expect(body).toMatchObject({
      requestId: expect.stringMatching(/^req_/),
      instance:  '/api/test',
    });
  });

  it('methodNotAllowed emits Allow header (RFC 9110 §15.5.6 MUST)', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => { throw Errors.methodNotAllowed(['GET', 'POST']); }
    );
    const res = await handler(makeReq({ method: 'DELETE', contentType: null }));
    expect(res.status).toBe(405);
    // RFC 9110 §15.5.6: MUST include Allow header
    expect(res.headers.get('Allow')).toBe('GET, POST');
  });

  it('Retry-After header present on retryable errors (RFC 6585 §4)', async () => {
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
    const res  = await handler(makeReq({ method: 'GET', contentType: null }));
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
    const res  = await handler(makeReq({ method: 'GET', contentType: null }));
    const body = await json(res) as Record<string, unknown>;
    expect(res.status).toBe(410);
    expect(body).toMatchObject({ detail: 'Invoice #7 has been permanently removed', retryable: false });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Unknown error guard — no stack trace leakage
// ══════════════════════════════════════════════════════════════════════════════

describe('Unknown error guard', () => {
  it('catches unhandled throw and returns 500 without exposing internals', async () => {
    const handler = createHandler(
      { tag: 'Test', auth: 'none' },
      async () => { throw new Error('SELECT * FROM users WHERE 1=1; DROP TABLE users'); }
    );
    const res  = await handler(makeReq({ method: 'GET', contentType: null }));
    const body = await json(res) as Record<string, unknown>;
    const text = JSON.stringify(body);

    expect(res.status).toBe(500);
    // Must NOT leak the raw error message
    expect(text).not.toContain('DROP TABLE');
    expect(text).not.toContain('SELECT');
    // Must give a safe generic detail
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

// ══════════════════════════════════════════════════════════════════════════════
// 10. Response envelope — no { data: null, error: ... } pattern
// ══════════════════════════════════════════════════════════════════════════════

describe('Envelope invariants', () => {
  it('success response always has "data" key, never "type" key', async () => {
    const handler = createHandler({ tag: 'Test', auth: 'none' }, async () => ok({ value: 42 }));
    const body = await json(await handler(makeReq({ method: 'GET', contentType: null }))) as Record<string, unknown>;
    expect('data' in body).toBe(true);
    expect('type' in body).toBe(false);  // 'type' is the RFC 9457 discriminator
  });

  it('error response always has "type" key (Problem URI), never "data" key', async () => {
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

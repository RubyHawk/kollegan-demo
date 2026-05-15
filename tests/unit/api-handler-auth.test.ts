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
import { ok } from '@platform/api/response';
import {
  json,
  makeReq,
  resetApiHandlerMocks,
  validateVapiAuth,
  verifyToken,
  type JWTPayload,
} from './api-handler.test-utils';

beforeEach(() => {
  resetApiHandlerMocks();
});

describe('API handler VAPI authentication', () => {
  it('allows request when validateVapiAuth returns null', async () => {
    vi.mocked(validateVapiAuth).mockReturnValue(null);
    const handler = createHandler({ tag: 'Test', auth: 'vapi' }, async () => ok({ ok: true }));
    const res = await handler(makeReq());
    expect(res.status).toBe(200);
  });

  it('returns 401 with WWW-Authenticate when auth fails', async () => {
    vi.mocked(validateVapiAuth).mockReturnValue({ status: 401 } as never);
    const handler = createHandler({ tag: 'Test', auth: 'vapi' }, async () => ok({}));
    const res = await handler(makeReq());

    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toContain('application/problem+json');
    expect(res.headers.get('WWW-Authenticate')).toMatch(/ApiKey realm=/);

    const body = await json(res) as Record<string, unknown>;
    expect(body).toMatchObject({
      status: 401,
      retryable: false,
    });
  });

  it('returns 500 when auth misconfiguration is detected', async () => {
    vi.mocked(validateVapiAuth).mockReturnValue({ status: 500 } as never);
    const handler = createHandler({ tag: 'Test', auth: 'vapi' }, async () => ok({}));
    const res = await handler(makeReq());
    expect(res.status).toBe(500);
  });
});

describe('API handler JWT authentication', () => {
  it('allows request with valid Bearer token', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ sub: 'usr_1', role: 'receptionist', type: 'access' } as JWTPayload);
    const handler = createHandler({ tag: 'Test', auth: 'jwt' }, async () => ok({ ok: true }));
    const res = await handler(makeReq({
      headers: { authorization: 'Bearer valid.jwt.token' },
    }));
    expect(res.status).toBe(200);
  });

  it('returns 401 with Bearer WWW-Authenticate when no token', async () => {
    const handler = createHandler({ tag: 'Test', auth: 'jwt' }, async () => ok({}));
    const res = await handler(makeReq({ headers: {} }));
    expect(res.status).toBe(401);
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

  it('returns 403 when the route requires MFA and the token lacks otp or hwk amr', async () => {
    vi.mocked(verifyToken).mockResolvedValue({
      sub: 'usr_1',
      role: 'admin',
      roles: ['admin'],
      type: 'access',
      amr: ['pwd'],
    } as JWTPayload);

    const handler = createHandler({ tag: 'Test', auth: 'jwt', requireMfa: true }, async () => ok({ ok: true }));
    const res = await handler(makeReq({
      headers: { authorization: 'Bearer valid.jwt.token' },
    }));

    expect(res.status).toBe(403);
  });
});

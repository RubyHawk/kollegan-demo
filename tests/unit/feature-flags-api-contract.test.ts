import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@platform/auth/jwt', () => ({
  verifyToken: vi.fn().mockResolvedValue({
    sub: 'user_1',
    orgId: 'org_1',
    userType: 'staff',
    roles: ['admin'],
    type: 'access',
  }),
  isTokenBlacklisted: vi.fn().mockResolvedValue(false),
  isUserBlacklisted: vi.fn().mockResolvedValue(false),
}));

vi.mock('@platform/cache/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 59, resetAt: Date.now() + 60_000 }),
}));

vi.mock('@platform/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@modules/supporting/feature-flags/application/feature-flags.service', () => ({
  listFeatureFlags: vi.fn().mockResolvedValue({ flags: [], total: 0 }),
}));

import { listFeatureFlags } from '@modules/supporting/feature-flags/application/feature-flags.service';
import { handleListFeatureFlags } from '@modules/supporting/feature-flags/api/handlers/feature-flag.handler';

function request(query = ''): NextRequest {
  return new NextRequest(`http://localhost/api/v1/feature-flags${query}`, {
    method: 'GET',
    headers: { authorization: 'Bearer token' },
  });
}

describe('feature flag API contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listFeatureFlags).mockResolvedValue({ flags: [], total: 0 });
  });

  it('parses includeExpired=false as false, not JavaScript truthy', async () => {
    const res = await handleListFeatureFlags(request('?includeExpired=false&limit=10'));

    expect(res.status).toBe(200);
    expect(listFeatureFlags).toHaveBeenCalledWith('org_1', expect.objectContaining({
      includeExpired: false,
      limit: 10,
      offset: 0,
    }));
  });

  it('parses includeExpired=true as true', async () => {
    const res = await handleListFeatureFlags(request('?includeExpired=true'));

    expect(res.status).toBe(200);
    expect(listFeatureFlags).toHaveBeenCalledWith('org_1', expect.objectContaining({
      includeExpired: true,
    }));
  });
});

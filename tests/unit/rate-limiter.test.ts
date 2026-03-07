import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit } from '@platform/cache/rate-limiter';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns allowed=true when count is within limit', async () => {
    // Mock setup returns count=1, limit=30
    const result = await checkRateLimit('test-ip', 30, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it('returns allowed=true on Redis failure (fail-open)', async () => {
    const { redis } = await import('@platform/cache/redis');
    vi.mocked(redis.pipeline).mockImplementationOnce(() => {
      throw new Error('Redis connection refused');
    });

    const result = await checkRateLimit('test-ip', 30, 60_000);
    expect(result.allowed).toBe(true);
  });

  it('includes remaining count in result', async () => {
    const result = await checkRateLimit('another-ip', 10, 60_000);
    expect(typeof result.remaining).toBe('number');
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });
});

import { redis } from './redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp in ms
}

/**
 * Redis-backed sliding-window rate limiter using a sorted set.
 * Each member is a unique timestamped key; old members are pruned each request.
 *
 * Falls back to ALLOW if Redis is unavailable (fail-open for service availability).
 *
 * @param key      Unique key for this client (e.g. IP address or 'vapi:<endpoint>')
 * @param limit    Max requests per window
 * @param windowMs Window duration in milliseconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  const windowSec = Math.ceil(windowMs / 1000);

  try {
    const pipeline = redis.pipeline();
    // Add current request
    pipeline.zadd(redisKey, now, `${now}-${Math.random().toString(36).slice(2)}`);
    // Remove requests outside the window
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    // Count remaining requests in window
    pipeline.zcard(redisKey);
    // Set expiry on the key
    pipeline.expire(redisKey, windowSec);

    const results = await pipeline.exec();
    const count = (results?.[2]?.[1] as number) ?? 0;

    return {
      allowed:   count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt:   now + windowMs,
    };
  } catch {
    // Redis unavailable — fail open to avoid blocking legitimate VAPI calls
    return { allowed: true, remaining: limit, resetAt: now + windowMs };
  }
}

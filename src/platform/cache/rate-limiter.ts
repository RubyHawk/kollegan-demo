/**
 * Rate limiter with Redis primary and in-memory fallback.
 *
 * ISO 27001 A.14 compensating control:
 * - Primary: Redis-backed sliding-window rate limiter (distributed, shared across instances)
 * - Fallback: In-memory rate limiter when Redis is unavailable (per-process, not distributed)
 *
 * The in-memory fallback means effective limits are multiplied by instance count in
 * multi-process deployments. This is acceptable as a degraded-mode control — it prevents
 * unbounded abuse even when Redis is down.
 *
 * JWT TTL of 15 minutes limits the exposure window for token revocation fail-open.
 * All actions are audit-logged regardless of Redis state.
 */

import { redis } from './redis';
import { logger } from '@platform/logging/logger';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp in ms
}

// ─── In-memory fallback ─────────────────────────────────────────────────────────

interface MemoryBucket {
  count: number;
  resetAt: number; // Unix timestamp in ms
}

const memoryStore = new Map<string, MemoryBucket>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60_000; // 1 minute

function cleanupMemoryStore(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of memoryStore) {
    if (bucket.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}

function checkMemoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  cleanupMemoryStore();

  const now = Date.now();
  const memKey = `rl:${key}`;
  const existing = memoryStore.get(memKey);

  if (!existing || existing.resetAt <= now) {
    // New window
    memoryStore.set(memKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  existing.count++;
  return {
    allowed:   existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt:   existing.resetAt,
  };
}

// ─── Main rate limiter ──────────────────────────────────────────────────────────

/**
 * Redis-backed sliding-window rate limiter using a sorted set.
 * Each member is a unique timestamped key; old members are pruned each request.
 *
 * Falls back to in-memory rate limiting if Redis is unavailable.
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
    // Redis unavailable — fall back to in-memory rate limiting
    logger.warn('RateLimiter', 'Redis unavailable, falling back to in-memory rate limiting', { key });
    return checkMemoryRateLimit(key, limit, windowMs);
  }
}

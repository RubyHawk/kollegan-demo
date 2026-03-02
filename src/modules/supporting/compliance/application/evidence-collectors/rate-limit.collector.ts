// A.8.6 — Capacity Management: Redis-backed rate limiting configuration snapshot

import { redis } from '@core/cache/redis';
import type { CollectorResult } from '../../domain/evidence.entity';

// Mirrors the rate limit config defined in route handlers.
// Static snapshot — reflects what is deployed in code.
const RATE_LIMIT_CONFIG = {
  login:         { max: 5,   windowMs: 60_000, description: 'Anti-brute-force on login' },
  accessReview:  { max: 20,  windowMs: 60_000, description: 'Admin access review' },
  leadsRead:     { max: 120, windowMs: 60_000, description: 'Lead list reads' },
  leadsWrite:    { max: 60,  windowMs: 60_000, description: 'Lead mutations' },
  default:       { max: 60,  windowMs: 60_000, description: 'Default per-route' },
};

export async function rateLimitCollector(
  _organizationId: string,
  controlId: string
): Promise<CollectorResult> {
  let redisReachable = false;
  try {
    const pong = await redis.ping();
    redisReachable = pong === 'PONG';
  } catch {
    // Redis unreachable — rate limiter is fail-open
  }

  const status = redisReachable ? 'pass' : 'warn';

  return {
    controlId,
    status,
    payload: {
      backend:      'redis-sorted-set',
      algorithm:    'sliding-window',
      redisReachable,
      routes:       RATE_LIMIT_CONFIG,
    },
    summary: `Redis-backed sliding-window rate limiting ${redisReachable ? 'active' : 'degraded (Redis unreachable)'}; login: ${RATE_LIMIT_CONFIG.login.max}/min, default: ${RATE_LIMIT_CONFIG.default.max}/min`,
  };
}

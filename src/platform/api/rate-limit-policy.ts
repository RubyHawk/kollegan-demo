import type { NextRequest } from 'next/server';
import type { JWTPayload } from '@platform/auth/jwt';

export type RateLimitAuthStrategy = 'vapi' | 'jwt' | 'internal' | 'none';

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = { max: 60, windowMs: 60_000 };

const AUTHENTICATED_RATE_LIMIT_MULTIPLIER = 4;
const AUTHENTICATED_RATE_LIMIT_FLOOR = 300;

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
}

function sanitizeRateLimitPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9:_-]/g, '_');
}

export function resolveRateLimitBudget(
  configured: RateLimitConfig,
  authStrategy: RateLimitAuthStrategy,
  isAuthenticatedJwt: boolean,
): RateLimitConfig {
  if (authStrategy !== 'jwt' || !isAuthenticatedJwt) {
    return configured;
  }

  return {
    ...configured,
    max: Math.max(configured.max * AUTHENTICATED_RATE_LIMIT_MULTIPLIER, AUTHENTICATED_RATE_LIMIT_FLOOR),
  };
}

export function buildRateLimitKey(
  tag: string,
  authStrategy: RateLimitAuthStrategy,
  req: NextRequest,
  jwtPayload: Pick<JWTPayload, 'sub'> | null,
): string {
  const identity = authStrategy === 'jwt' && jwtPayload?.sub
    ? `user:${jwtPayload.sub}`
    : `ip:${getClientIp(req)}`;

  return `${sanitizeRateLimitPart(tag)}:${identity}`;
}

import { SignJWT, jwtVerify, type JWTPayload as JosePayload } from 'jose';
import { logger } from '@core/logging/logger';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-me');
const ALGORITHM = 'HS256';
const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

// ─── Payload ───────────────────────────────────────────────────────────────────

export interface JWTPayload extends JosePayload {
  sub: string;           // User.id (was StaffUser.id during dual-write period)
  type: 'access' | 'refresh';
  // Phase 1 extensions — required on all new tokens
  userType: 'staff' | 'customer';
  orgId: string | null;  // null = super_admin (cross-org access)
  roles: string[];       // e.g. ['admin'] or ['customer_viewer']
  aud: string;           // 'internal' | 'customer:{orgSlug}'
  // Explicitly declared to override JosePayload's index signature shadowing
  jti: string;           // mandatory on all tokens (set by .setJti())
  exp: number;           // unix timestamp — set by .setExpirationTime()
  iat: number;           // unix timestamp — set by .setIssuedAt()
  // Legacy field kept for dual-write backward compat (deprecated, remove in Phase 3)
  role?: string;         // old StaffUser role — preserved for existing sessions during migration
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function randomJti(): string {
  // crypto.randomUUID() is available in Node 14.17+ and all modern runtimes
  return crypto.randomUUID();
}

// ─── Token signing ─────────────────────────────────────────────────────────────

export async function signAccessToken(
  payload: Omit<JWTPayload, 'type' | 'iat' | 'exp' | 'jti'>
): Promise<{ token: string; jti: string }> {
  const jti = randomJti();
  const token = await new SignJWT({ ...payload, type: 'access' } as Record<string, unknown>)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .setJti(jti)
    .sign(SECRET_KEY);
  return { token, jti };
}

/**
 * @param ttl  JWT expiration — '7d' for staff (default), '30d' for customers.
 *             Must match the Session.expiresAt value written to the DB.
 */
export async function signRefreshToken(
  payload: Omit<JWTPayload, 'type' | 'iat' | 'exp' | 'jti'>,
  ttl: string = REFRESH_TTL,
): Promise<{ token: string; jti: string }> {
  const jti = randomJti();
  const token = await new SignJWT({ ...payload, type: 'refresh' } as Record<string, unknown>)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .setJti(jti)
    .sign(SECRET_KEY);
  return { token, jti };
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
  return payload as JWTPayload;
}

// ─── Token revocation ──────────────────────────────────────────────────────────

/**
 * Check if a token has been blacklisted in Redis.
 *
 * Fail-open behavior: if Redis is unavailable, returns false so auth still works.
 * The Session.revokedAt DB field is the authoritative source of truth when Redis
 * is unavailable — the application layer must check both.
 *
 * This fail-open is a deliberate availability-over-security trade-off, documented
 * here per the architecture plan.
 */
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  try {
    const { redis } = await import('@core/cache/redis');
    const result = await redis.get(`blacklist:${jti}`);
    return result !== null;
  } catch {
    return false; // fail open if Redis unavailable — see note above
  }
}

/**
 * Blacklist a token in Redis until its expiry.
 * Non-critical: logs on failure but does not throw.
 */
export async function blacklistToken(jti: string, expiresInSec: number): Promise<void> {
  try {
    const { redis } = await import('@core/cache/redis');
    await redis.setex(`blacklist:${jti}`, expiresInSec, '1');
  } catch {
    logger.warn('jwt', 'Failed to blacklist token in Redis', { jti });
  }
}

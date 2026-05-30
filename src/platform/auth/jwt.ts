import { SignJWT, jwtVerify, type JWTPayload as JosePayload } from 'jose';
import { logger } from '@platform/logging/logger';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-me');
const ALGORITHM = 'HS256';
export const ACCESS_TOKEN_MAX_AGE_SEC = 60 * 60 * 2;
const ACCESS_TTL = '2h';
const REFRESH_TTL = '7d';

// ─── Payload ───────────────────────────────────────────────────────────────────

export interface JWTPayload extends JosePayload {
  sub: string;           // User.id (was StaffUser.id during dual-write period)
  type: 'access' | 'refresh' | 'mfa_challenge';
  // Phase 1 extensions — required on all new tokens
  userType: 'staff' | 'customer';
  orgId: string | null;  // null = super_admin (cross-org access)
  roles: string[];       // e.g. ['admin'] or ['customer_viewer']
  aud: string;           // 'internal' | 'customer:{orgSlug}'
  // Explicitly declared to override JosePayload's index signature shadowing
  jti: string;           // mandatory on all tokens (set by .setJti())
  exp: number;           // unix timestamp — set by .setExpirationTime()
  iat: number;           // unix timestamp — set by .setIssuedAt()
  // Phase 2: Authentication Method References (RFC 8176)
  // e.g. ['pwd'] = password only; ['pwd','otp'] = password + TOTP; ['pwd','hwk'] = password + passkey
  amr?: string[];
  // Legacy field kept for dual-write backward compat (deprecated, remove in Phase 3)
  role?: string;         // old StaffUser role — preserved for existing sessions during migration
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function randomJti(): string {
  // crypto.randomUUID() is available in Node 14.17+ and all modern runtimes
  return crypto.randomUUID();
}

// ─── Opaque refresh token (Phase 2) ────────────────────────────────────────────
//
// A random 32-byte hex string stored in the httpOnly cookie.
// The DB stores SHA-256(raw) so a stolen DB dump doesn't expose usable tokens.
// Replaces the JWT refresh token, which embedded user claims in the cookie value.

export function generateOpaqueToken(): { raw: string; hash: string } {
  const rawBytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = Array.from(rawBytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const hash = hashOpaqueToken(raw);
  return { raw, hash };
}

export function hashOpaqueToken(raw: string): string {
  // SHA-256 via SubtleCrypto is async; we use a sync hex approach with the
  // Node.js crypto module instead so callers don't need to await.
  // This function is deliberately not async — it's called on the hot path.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require('crypto') as typeof import('crypto');
  return createHash('sha256').update(raw).digest('hex');
}

// ─── MFA challenge token ────────────────────────────────────────────────────────
//
// Short-lived JWT (5 minutes) set in an httpOnly cookie after password verification
// when MFA is required. Consumed by /api/v1/auth/mfa/verify or the WebAuthn verify route.
// Contains only userId + type — no roles, no org claims.

const MFA_CHALLENGE_TTL = '5m';

export async function signMfaChallengeToken(userId: string, rememberMe?: boolean): Promise<string> {
  const jti = randomJti();
  return new SignJWT({ sub: userId, type: 'mfa_challenge', roles: [], aud: 'mfa', orgId: null, userType: 'staff', rememberMe: rememberMe ?? false } as Record<string, unknown>)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(MFA_CHALLENGE_TTL)
    .setJti(jti)
    .sign(SECRET_KEY);
}

export async function verifyMfaChallengeToken(token: string): Promise<{ userId: string; rememberMe: boolean }> {
  const { payload } = await jwtVerify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
  const p = payload as JWTPayload & { rememberMe?: boolean };
  if (p.type !== 'mfa_challenge') {
    throw new Error('Invalid token type');
  }
  return { userId: p.sub, rememberMe: p.rememberMe ?? false };
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
    const { redis } = await import('@platform/cache/redis');
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
    const { redis } = await import('@platform/cache/redis');
    await redis.setex(`blacklist:${jti}`, expiresInSec, '1');
  } catch {
    logger.warn('jwt', 'Failed to blacklist token in Redis', { jti });
  }
}

// ─── User-level revocation ─────────────────────────────────────────────────────
//
// Used for "sign out all devices" and GDPR erasure.
// Stores a revocation epoch per user; any token whose iat ≤ that epoch is rejected.
// TTL = 30 days (max refresh token lifetime) so the key outlives all pre-revocation tokens.

const USER_REVOKE_TTL_SEC = 60 * 60 * 24 * 30; // 30d — matches max refresh TTL

/**
 * Mark all tokens issued for a user before now() as revoked.
 * Call this on revokeAllSessions() and GDPR erasure.
 * Non-critical: logs on failure but does not throw.
 */
export async function blacklistUserTokens(userId: string): Promise<void> {
  try {
    const { redis } = await import('@platform/cache/redis');
    const revokedAt = Math.floor(Date.now() / 1000);
    await redis.setex(`blacklist:user:${userId}`, USER_REVOKE_TTL_SEC, String(revokedAt));
  } catch {
    logger.warn('jwt', 'Failed to set user token blacklist in Redis', { userId });
  }
}

/**
 * Returns true if all tokens for this user issued at or before issuedAt are revoked.
 * Fail-open: if Redis is unavailable, returns false so auth still works.
 */
export async function isUserBlacklisted(userId: string, issuedAt: number): Promise<boolean> {
  try {
    const { redis } = await import('@platform/cache/redis');
    const value = await redis.get(`blacklist:user:${userId}`);
    if (value === null) return false;
    // Strict less-than: tokens issued AT the exact revocation second are valid.
    // Using <= would block tokens issued in the same second as the logout,
    // preventing immediate re-login after sign-out.
    return issuedAt < parseInt(value, 10);
  } catch {
    return false; // fail open — same rationale as isTokenBlacklisted
  }
}

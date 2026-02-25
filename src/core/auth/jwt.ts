import { SignJWT, jwtVerify, type JWTPayload as JosePayload } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-me');
const ALGORITHM = 'HS256';
const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

export interface JWTPayload extends JosePayload {
  sub: string;   // staff user ID
  role: string;  // 'receptionist' | 'manager' | 'admin'
  type: 'access' | 'refresh';
}

export async function signAccessToken(
  payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>
): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' } as Record<string, unknown>)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(SECRET_KEY);
}

export async function signRefreshToken(
  payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>
): Promise<string> {
  return new SignJWT({ ...payload, type: 'refresh' } as Record<string, unknown>)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
  return payload as JWTPayload;
}

/**
 * Check if a token has been blacklisted in Redis.
 * Used for refresh token revocation on logout.
 */
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  try {
    const { redis } = await import('@core/cache/redis');
    const result = await redis.get(`blacklist:${jti}`);
    return result !== null;
  } catch {
    return false; // fail open if Redis unavailable
  }
}

/**
 * Blacklist a token in Redis until its expiry.
 */
export async function blacklistToken(jti: string, expiresInSec: number): Promise<void> {
  try {
    const { redis } = await import('@core/cache/redis');
    await redis.setex(`blacklist:${jti}`, expiresInSec, '1');
  } catch {
    // Non-critical: log but don't throw
    console.warn('[jwt] Failed to blacklist token in Redis:', jti);
  }
}

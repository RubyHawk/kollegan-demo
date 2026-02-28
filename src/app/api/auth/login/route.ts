/**
 * POST /api/auth/login
 *
 * Sets an httpOnly refresh token cookie on success.
 * Rate limit: 5 attempts per minute per IP (anti brute-force).
 *
 * This route intentionally does NOT use createHandler() because it needs
 * to set an httpOnly cookie directly on the NextResponse. All other
 * security features (rate limiting, validation) are applied manually
 * using the same core utilities that createHandler() uses.
 *
 * Dual-write period (Phase 1): auth.service.login() tries usr_users first,
 * falls back to StaffUser. The cookie name and JWT audience differ by userType.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { login } from '@modules/supporting/auth';
import { log, AUDIT_ACTIONS } from '@modules/supporting/audit';

export const dynamic = 'force-dynamic';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const REFRESH_TTL_SEC_STAFF = 60 * 60 * 24 * 7;      // 7 days
const REFRESH_TTL_SEC_CUSTOMER = 60 * 60 * 24 * 30;  // 30 days

export async function POST(req: NextRequest) {
  // -- Rate limiting: 5 attempts per minute per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';

  const rl = await checkRateLimit(ip, 5, 60_000);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/rate-limit', title: 'Too Many Requests', status: 429 },
      {
        status: 429,
        headers: {
          'Content-Type': 'application/problem+json',
          'Retry-After': String(retryAfter),
          'RateLimit-Remaining': '0',
          'RateLimit-Reset': String(retryAfter),
        },
      }
    );
  }

  // -- Input validation
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/bad-request', title: 'Bad Request', status: 400, detail: 'Request body is not valid JSON' },
      { status: 400, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/bad-request', title: 'Bad Request', status: 400, detail: 'Invalid email or password format' },
      { status: 400, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  const { email, password } = parsed.data;
  const userAgent = req.headers.get('user-agent') ?? undefined;
  const ipAddress = ip !== 'unknown' ? ip : undefined;

  // -- Authentication
  let result;
  try {
    result = await login({ email, password, ipAddress, userAgent });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;

    await log({
      action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
      resourceType: 'User',
      resourceId: email,
      metadata: { ip: ipAddress ?? null, reason: code ?? 'unknown' },
    }).catch(() => {});

    if (code === 'INVALID_CREDENTIALS' || code === 'ACCOUNT_DISABLED') {
      return NextResponse.json(
        {
          type: 'https://docs.kollegan.ai/problems/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'Invalid email or password',
        },
        {
          status: 401,
          headers: {
            'Content-Type': 'application/problem+json',
            'WWW-Authenticate': 'Bearer realm="api.kollegan.ai", charset="UTF-8"',
          },
        }
      );
    }

    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/internal', title: 'Internal Server Error', status: 500 },
      { status: 500, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  // -- Audit successful login
  await log({
    action: AUDIT_ACTIONS.USER_LOGIN,
    organizationId: result.user.orgId,
    actorId: result.user.id,
    actorType: 'user',
    resourceType: 'User',
    resourceId: result.user.id,
    metadata: { ip: ipAddress ?? null },
  }).catch(() => {});

  // -- Set refresh token cookie
  // Staff and customer use different cookie names to prevent cross-contamination.
  const isCustomer = result.user.userType === 'customer';
  const cookieName = isCustomer ? 'portal_token' : 'token';
  const ttlSec = isCustomer ? REFRESH_TTL_SEC_CUSTOMER : REFRESH_TTL_SEC_STAFF;

  const res = NextResponse.json({
    data: {
      user: {
        id: result.user.id,
        email: result.user.email,
        userType: result.user.userType,
        roles: result.user.roles,
      },
    },
  });

  res.cookies.set(cookieName, result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ttlSec,
    path: '/',
  });

  return res;
}

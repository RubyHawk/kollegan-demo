/**
 * POST /api/auth/logout
 *
 * Revokes the opaque refresh token: sets Session.revokedAt in DB.
 * Clears both staff and customer cookies.
 *
 * Phase 2: refresh token is now an opaque value — look up session by SHA-256 hash
 * to get userId for the audit log (instead of verifying a JWT).
 *
 * Idempotent: calling logout with an already-revoked or missing token is a no-op.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@modules/supporting/auth';
import { sessionRepository } from '@modules/supporting/auth';
import { log, AUDIT_ACTIONS } from '@modules/supporting/audit';
import { hashOpaqueToken } from '@core/auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const staffToken  = req.cookies.get('token')?.value;
  const portalToken = req.cookies.get('portal_token')?.value;
  const rawToken    = staffToken ?? portalToken;

  if (rawToken) {
    // Look up session for audit metadata (opaque token — no JWT claims to read)
    let userId: string | undefined;
    let orgId: string | null = null;
    try {
      const hash    = hashOpaqueToken(rawToken);
      const session = await sessionRepository.findByTokenHash(hash);
      if (session) userId = session.userId;
    } catch {
      // Session lookup failed — still proceed to clear cookies
    }

    await logout(rawToken);

    if (userId) {
      await log({
        action: AUDIT_ACTIONS.USER_LOGOUT,
        organizationId: orgId,
        actorId: userId,
        actorType: 'user',
        resourceType: 'User',
        resourceId: userId,
      }).catch(() => {});
    }
  }

  const res = NextResponse.json({ data: { ok: true } });

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
  res.cookies.set('token', '', cookieOpts);
  res.cookies.set('portal_token', '', cookieOpts);
  res.cookies.set('mfa_challenge', '', cookieOpts);

  return res;
}

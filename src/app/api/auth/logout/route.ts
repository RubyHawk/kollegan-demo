/**
 * POST /api/auth/logout
 *
 * Revokes the refresh token: sets Session.revokedAt in DB and blacklists
 * the JTI in Redis. Clears both staff and customer cookies.
 *
 * Idempotent: calling logout with an already-revoked or missing token is a no-op.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@modules/supporting/auth';
import { log, AUDIT_ACTIONS } from '@modules/supporting/audit';
import { verifyToken } from '@core/auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Read from whichever cookie is present (staff or customer)
  const staffToken = req.cookies.get('token')?.value;
  const portalToken = req.cookies.get('portal_token')?.value;
  const refreshToken = staffToken ?? portalToken;

  if (refreshToken) {
    // Get userId for audit log before revoking
    let userId: string | undefined;
    let orgId: string | null = null;
    try {
      const payload = await verifyToken(refreshToken);
      userId = payload.sub;
      orgId = payload.orgId ?? null;
    } catch {
      // Token may already be expired — still proceed to clear cookies
    }

    await logout(refreshToken);

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

  // Clear both possible cookie names
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
  res.cookies.set('token', '', cookieOpts);
  res.cookies.set('portal_token', '', cookieOpts);

  return res;
}

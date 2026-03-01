/**
 * POST /api/auth/mfa/setup
 *
 * Generate a new TOTP secret and QR code for the authenticated user.
 * Does NOT enable MFA — the user must call /api/auth/mfa/enable after
 * scanning the QR and verifying the code in their authenticator app.
 *
 * Requires: JWT auth.
 */

import { NextRequest } from 'next/server';
import { createHandler } from '@core/api/handler';
import { ok } from '@core/api/response';
import { verifyToken } from '@core/auth/jwt';
import { generateTotpSetup } from '@modules/supporting/auth';

export const POST = createHandler(
  { auth: 'jwt', tag: 'MFA:Setup', rateLimit: { max: 10, windowMs: 60_000 } },
  async (ctx) => {
    const { req } = ctx as { req: NextRequest };
    const token = req.headers.get('authorization')?.slice(7)
      ?? req.cookies.get('token')?.value
      ?? req.cookies.get('portal_token')?.value
      ?? '';
    const payload = await verifyToken(token);
    const userId = payload.sub;
    // Email not in JWT payload — use sub as fallback label
    const userEmail = String(payload['email'] ?? userId);

    const setup = await generateTotpSetup(userId, userEmail);

    return ok({
      secret: setup.secret,
      qrDataUrl: setup.qrDataUrl,
      otpAuthUrl: setup.otpAuthUrl,
    });
  }
);

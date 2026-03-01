/**
 * POST /api/auth/webauthn/authenticate/options
 *
 * Start passkey authentication ceremony during login step 2.
 * Reads the mfa_challenge cookie (set in step 1) to identify the user.
 * Returns WebAuthn PublicKeyCredentialRequestOptions JSON.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@core/cache/rate-limiter';
import { verifyMfaChallengeToken } from '@core/auth/jwt';
import { beginAuthentication } from '@modules/supporting/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';

  const rl = await checkRateLimit(`webauthn:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/rate-limit', title: 'Too Many Requests', status: 429 },
      { status: 429, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  const challengeToken = req.cookies.get('mfa_challenge')?.value;
  if (!challengeToken) {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'MFA challenge not found or expired' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  let userId: string;
  try {
    ({ userId } = await verifyMfaChallengeToken(challengeToken));
  } catch {
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'MFA challenge expired' },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  try {
    const options = await beginAuthentication(userId);
    return NextResponse.json({ data: options });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'NO_CREDENTIALS') {
      return NextResponse.json(
        { type: 'https://docs.kollegan.ai/problems/bad-request', title: 'Bad Request', status: 400, detail: 'No passkeys registered for this account' },
        { status: 400, headers: { 'Content-Type': 'application/problem+json' } }
      );
    }
    return NextResponse.json(
      { type: 'https://docs.kollegan.ai/problems/internal', title: 'Internal Server Error', status: 500 },
      { status: 500, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }
}

import { NextRequest } from 'next/server';
import { Errors } from '@platform/api/errors';
import { verifyToken, type JWTPayload } from '@platform/auth/jwt';
import { getMfaStatus } from '../../application/mfa-state.service';

export function extractAccessToken(req: NextRequest): string {
  return req.headers.get('authorization')?.slice(7)
    ?? req.cookies.get('at')?.value
    ?? '';
}

export function isMfaAuthenticated(amr: string[] | undefined): boolean {
  const methods = amr ?? [];
  return methods.includes('otp') || methods.includes('hwk');
}

export async function verifyAccessPayload(req: NextRequest): Promise<JWTPayload> {
  return verifyToken(extractAccessToken(req));
}

export async function assertStepUpForFactorMutation(userId: string, amr: string[] | undefined): Promise<void> {
  const status = await getMfaStatus(userId);
  if (status.enabled && !isMfaAuthenticated(amr)) {
    throw Errors.forbidden('This change requires a multi-factor-authenticated session');
  }
}

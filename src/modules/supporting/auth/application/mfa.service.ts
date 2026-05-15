/**
 * MFA service — TOTP and backup code management.
 *
 * TOTP: time-based one-time passwords (RFC 6238) via otplib v13.
 * Backup codes: 10 random 8-character codes, bcrypt-hashed before storage.
 */

import bcrypt from 'bcryptjs';
import { generateSecret, verify as totpVerify, generateURI } from 'otplib';
import qrcode from 'qrcode';
import { logger } from '@platform/logging/logger';
import { BRAND_NAME } from '@shared/branding';
import { revokeAllSessions } from './auth.service';
import {
  getMfaStatus as getComputedMfaStatus,
  getStoredFactorState,
  type MfaStatus,
} from './mfa-state.service';
import { userRepository } from '../infrastructure/user.repository';
import { webAuthnRepository } from '../infrastructure/webauthn.repository';

const TAG = 'MfaService';
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;
const BCRYPT_COST = 12;
const TOTP_REPLAY_TTL_SEC = 90;
const usedTotpTimeSteps = new Map<string, number>();

export interface TotpSetupResult {
  secret: string;
  qrDataUrl: string;
  otpAuthUrl: string;
}

export type { MfaStatus } from './mfa-state.service';

export async function generateTotpSetup(userId: string, userEmail: string): Promise<TotpSetupResult> {
  const secret = generateSecret();

  await userRepository.updateMfaFields(userId, {
    pendingTotpSecret: secret,
  });

  const otpAuthUrl = generateURI({
    issuer: BRAND_NAME,
    label: userEmail,
    secret,
  });
  const qrDataUrl = await qrcode.toDataURL(otpAuthUrl);

  logger.info(TAG, 'TOTP setup initiated', { userId });

  return { secret, qrDataUrl, otpAuthUrl };
}

export async function verifyTotpCode(
  userId: string,
  code: string,
  options: { pending?: boolean } = {},
): Promise<boolean> {
  const state = await getStoredFactorState(userId);
  const secret = options.pending ? state?.pendingTotpSecret : state?.totpSecret;

  if (!secret) return false;

  const result = await totpVerify({ token: code.replace(/\s/g, ''), secret, epochTolerance: 30 });
  if (!result.valid) return false;

  const matchedTimeStep = (result as { timeStep?: number }).timeStep;
  if (typeof matchedTimeStep !== 'number') return false;
  return markTotpTimeStepUsed(userId, matchedTimeStep);
}

export async function enableTotp(userId: string, code: string): Promise<string[]> {
  const valid = await verifyTotpCode(userId, code, { pending: true });
  if (!valid) {
    throw Object.assign(new Error('Invalid TOTP code'), { code: 'INVALID_TOTP' });
  }

  const state = await getStoredFactorState(userId);
  if (!state?.pendingTotpSecret) {
    throw Object.assign(new Error('No pending TOTP setup found'), { code: 'TOTP_SETUP_NOT_STARTED' });
  }

  const { plainCodes, hashedCodes } = await generateBackupCodesInternal();

  await userRepository.updateMfaFields(userId, {
    mfaEnabled: true,
    totpSecret: state.pendingTotpSecret,
    pendingTotpSecret: null,
    backupCodes: hashedCodes,
  });

  logger.info(TAG, 'TOTP MFA enabled', { userId });

  return plainCodes;
}

export async function disableMfa(userId: string): Promise<void> {
  const state = await getStoredFactorState(userId);
  if (!state?.totpSecret) {
    throw Object.assign(new Error('TOTP is not enabled'), { code: 'TOTP_NOT_ENABLED' });
  }

  const status = await getComputedMfaStatus(userId);
  if (status.enrolledMethods.length <= 1) {
    throw Object.assign(new Error('Cannot remove the last primary factor'), { code: 'LAST_PRIMARY_FACTOR' });
  }

  await userRepository.updateMfaFields(userId, {
    totpSecret: null,
    pendingTotpSecret: null,
  });
  await getComputedMfaStatus(userId);
  await revokeAllSessions(userId);

  logger.info(TAG, 'TOTP factor removed', { userId });
}

export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  const status = await getComputedMfaStatus(userId);
  if (!status.enabled) {
    throw Object.assign(new Error('MFA is not enabled'), { code: 'MFA_NOT_ENABLED' });
  }

  const { plainCodes, hashedCodes } = await generateBackupCodesInternal();

  await userRepository.updateMfaFields(userId, {
    backupCodes: hashedCodes,
  });

  logger.info(TAG, 'Backup codes regenerated', { userId });

  return plainCodes;
}

export async function getBackupCodeCount(userId: string): Promise<number> {
  const state = await getStoredFactorState(userId);
  return state?.backupCodes.length ?? 0;
}

export async function consumeBackupCode(userId: string, rawCode: string): Promise<boolean> {
  const normalised = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const state = await getStoredFactorState(userId);

  if (!state) return false;

  let matchIndex = -1;
  for (let i = 0; i < state.backupCodes.length; i++) {
    const matches = await bcrypt.compare(normalised, state.backupCodes[i]);
    if (matches) {
      matchIndex = i;
      break;
    }
  }

  if (matchIndex === -1) return false;

  const remaining = [...state.backupCodes];
  remaining.splice(matchIndex, 1);

  const consumed = await userRepository.consumeBackupCodeHash(userId, state.backupCodes[matchIndex], remaining);
  if (!consumed) return false;

  logger.info(TAG, 'Backup code consumed', { userId, remaining: remaining.length });

  return true;
}

export async function getMfaStatus(userId: string): Promise<MfaStatus> {
  return getComputedMfaStatus(userId);
}

export async function resetMfaForRecovery(userId: string, graceExpiresAt: Date): Promise<void> {
  await webAuthnRepository.deleteAllForUser(userId);
  await userRepository.updateMfaFields(userId, {
    mfaEnabled: false,
    totpSecret: null,
    pendingTotpSecret: null,
    backupCodes: [],
    mfaGraceExpiresAt: graceExpiresAt,
  });
  await revokeAllSessions(userId);

  logger.info(TAG, 'MFA reset for recovery', { userId, graceExpiresAt: graceExpiresAt.toISOString() });
}

async function generateBackupCodesInternal(): Promise<{ plainCodes: string[]; hashedCodes: string[] }> {
  const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const plainCodes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(BACKUP_CODE_LENGTH));
    const code = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
    plainCodes.push(code);
  }

  const hashedCodes = await Promise.all(
    plainCodes.map((plainCode) => bcrypt.hash(plainCode, BCRYPT_COST))
  );

  return { plainCodes, hashedCodes };
}

async function markTotpTimeStepUsed(userId: string, timeStep: number): Promise<boolean> {
  const key = `mfa:totp:${userId}:${timeStep}`;
  try {
    const { redis } = await import('@platform/cache/redis');
    const result = await redis.set(key, '1', 'EX', TOTP_REPLAY_TTL_SEC, 'NX');
    return result === 'OK';
  } catch {
    cleanupTotpReplayMemory();
    const now = Date.now();
    const existingExpiry = usedTotpTimeSteps.get(key);
    if (existingExpiry && existingExpiry > now) {
      return false;
    }
    usedTotpTimeSteps.set(key, now + TOTP_REPLAY_TTL_SEC * 1000);
    return true;
  }
}

function cleanupTotpReplayMemory(): void {
  const now = Date.now();
  for (const [key, expiresAt] of usedTotpTimeSteps) {
    if (expiresAt <= now) {
      usedTotpTimeSteps.delete(key);
    }
  }
}

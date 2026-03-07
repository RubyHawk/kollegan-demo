/**
 * MFA service — TOTP and backup code management.
 *
 * TOTP: time-based one-time passwords (RFC 6238) via otplib v13.
 * Backup codes: 10 random 8-character codes, bcrypt-hashed before storage.
 */

import bcrypt from 'bcryptjs';
import { generateSecret, verify as totpVerify, generateURI } from 'otplib';
import qrcode from 'qrcode';
import { prisma } from '@platform/database/prisma';
import { logger } from '@platform/logging/logger';

const TAG = 'MfaService';
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;
const BCRYPT_COST = 12;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface TotpSetupResult {
  secret: string;
  qrDataUrl: string;
  otpAuthUrl: string;
}

export interface MfaStatus {
  enabled: boolean;
  totpConfigured: boolean;
  backupCodesRemaining: number;
}

// ─── TOTP ──────────────────────────────────────────────────────────────────────

export async function generateTotpSetup(userId: string, userEmail: string): Promise<TotpSetupResult> {
  const secret = generateSecret();

  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: secret },
  });

  const otpAuthUrl = generateURI({
    issuer: 'Kollegan',
    label: userEmail,
    secret,
  });
  const qrDataUrl = await qrcode.toDataURL(otpAuthUrl);

  logger.info(TAG, 'TOTP setup initiated', { userId });

  return { secret, qrDataUrl, otpAuthUrl };
}

export async function verifyTotpCode(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true },
  });

  if (!user?.totpSecret) return false;

  const result = await totpVerify({ token: code.replace(/\s/g, ''), secret: user.totpSecret, epochTolerance: 30 });
  return result.valid;
}

export async function enableTotp(userId: string, code: string): Promise<string[]> {
  const valid = await verifyTotpCode(userId, code);
  if (!valid) {
    throw Object.assign(new Error('Invalid TOTP code'), { code: 'INVALID_TOTP' });
  }

  const { plainCodes, hashedCodes } = await generateBackupCodesInternal();

  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: true, backupCodes: hashedCodes },
  });

  logger.info(TAG, 'TOTP MFA enabled', { userId });

  return plainCodes;
}

export async function disableMfa(userId: string, code: string): Promise<void> {
  const codeValid = await verifyTotpCode(userId, code);
  if (!codeValid) {
    const backupValid = await consumeBackupCode(userId, code);
    if (!backupValid) {
      throw Object.assign(new Error('Invalid code'), { code: 'INVALID_CODE' });
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: false, totpSecret: null, backupCodes: [], mfaGraceExpiresAt: null },
  });

  logger.info(TAG, 'MFA disabled', { userId });
}

// ─── Backup codes ───────────────────────────────────────────────────────────────

export async function regenerateBackupCodes(userId: string, totpCode: string): Promise<string[]> {
  const valid = await verifyTotpCode(userId, totpCode);
  if (!valid) {
    throw Object.assign(new Error('Invalid TOTP code'), { code: 'INVALID_TOTP' });
  }

  const { plainCodes, hashedCodes } = await generateBackupCodesInternal();

  await prisma.user.update({
    where: { id: userId },
    data: { backupCodes: hashedCodes },
  });

  logger.info(TAG, 'Backup codes regenerated', { userId });

  return plainCodes;
}

export async function getBackupCodeCount(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { backupCodes: true },
  });
  return user?.backupCodes.length ?? 0;
}

export async function consumeBackupCode(userId: string, rawCode: string): Promise<boolean> {
  const normalised = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, '');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, backupCodes: true },
  });

  if (!user) return false;

  let matchIndex = -1;
  for (let i = 0; i < user.backupCodes.length; i++) {
    const matches = await bcrypt.compare(normalised, user.backupCodes[i]);
    if (matches) { matchIndex = i; break; }
  }

  if (matchIndex === -1) return false;

  const remaining = [...user.backupCodes];
  remaining.splice(matchIndex, 1);

  await prisma.user.update({
    where: { id: userId },
    data: { backupCodes: remaining },
  });

  logger.info(TAG, 'Backup code consumed', { userId, remaining: remaining.length });

  return true;
}

export async function getMfaStatus(userId: string): Promise<MfaStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true, totpSecret: true, backupCodes: true },
  });

  return {
    enabled: user?.mfaEnabled ?? false,
    totpConfigured: !!user?.totpSecret,
    backupCodesRemaining: user?.backupCodes.length ?? 0,
  };
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

async function generateBackupCodesInternal(): Promise<{ plainCodes: string[]; hashedCodes: string[] }> {
  const plainCodes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(BACKUP_CODE_LENGTH));
    const code = Array.from(bytes, (b) => b.toString(36).toUpperCase().padStart(2, '0'))
      .join('')
      .slice(0, BACKUP_CODE_LENGTH);
    plainCodes.push(code);
  }

  const hashedCodes = await Promise.all(
    plainCodes.map((c) => bcrypt.hash(c, BCRYPT_COST))
  );

  return { plainCodes, hashedCodes };
}

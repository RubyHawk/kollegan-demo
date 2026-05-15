import { beforeEach, describe, expect, it, vi } from 'vitest';
import { verify as totpVerify } from 'otplib';
import bcrypt from 'bcryptjs';
import { getStoredFactorState } from '@modules/supporting/auth/application/mfa-state.service';
import { userRepository } from '@modules/supporting/auth/infrastructure/user.repository';
import { redis } from '@platform/cache/redis';
import {
  consumeBackupCode,
  verifyTotpCode,
} from '@modules/supporting/auth/application/mfa.service';

vi.mock('otplib', () => ({
  generateSecret: vi.fn(),
  generateURI: vi.fn(),
  verify: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

vi.mock('@platform/logging/logger', () => ({
  logger: {
    info: vi.fn(),
  },
}));

vi.mock('@modules/supporting/auth/application/auth.service', () => ({
  revokeAllSessions: vi.fn(),
}));

vi.mock('@modules/supporting/auth/application/mfa-state.service', () => ({
  getStoredFactorState: vi.fn(),
  getMfaStatus: vi.fn(),
}));

vi.mock('@modules/supporting/auth/infrastructure/user.repository', () => ({
  userRepository: {
    updateMfaFields: vi.fn(),
    consumeBackupCodeHash: vi.fn(),
  },
}));

vi.mock('@modules/supporting/auth/infrastructure/webauthn.repository', () => ({
  webAuthnRepository: {
    deleteAllForUser: vi.fn(),
  },
}));

vi.mock('@platform/cache/redis', () => ({
  redis: {
    set: vi.fn(),
  },
}));

describe('mfa.service', () => {
  const compareMock = vi.mocked(bcrypt.compare) as unknown as {
    mockResolvedValue(value: boolean): unknown;
    mockResolvedValueOnce(value: boolean): {
      mockResolvedValueOnce(nextValue: boolean): unknown;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStoredFactorState).mockResolvedValue({
      mfaEnabled: true,
      totpSecret: 'totp-secret',
      pendingTotpSecret: null,
      backupCodes: [],
      mfaGraceExpiresAt: null,
      passkeysRegistered: 0,
    });
  });

  it('rejects a reused TOTP time step after the first successful verification', async () => {
    vi.mocked(totpVerify).mockResolvedValue({ valid: true, delta: 0, timeStep: 123, epoch: 3690 } as never);
    vi.mocked(redis.set).mockResolvedValueOnce('OK').mockResolvedValueOnce(null);

    await expect(verifyTotpCode('user-1', '123456')).resolves.toBe(true);
    await expect(verifyTotpCode('user-1', '123456')).resolves.toBe(false);
  });

  it('uses an atomic conditional update when consuming a backup code', async () => {
    vi.mocked(getStoredFactorState).mockResolvedValue({
      mfaEnabled: true,
      totpSecret: 'totp-secret',
      pendingTotpSecret: null,
      backupCodes: ['hash-a', 'hash-b'],
      mfaGraceExpiresAt: null,
      passkeysRegistered: 0,
    });
    compareMock.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    vi.mocked(userRepository.consumeBackupCodeHash).mockResolvedValue(true);

    await expect(consumeBackupCode('user-1', 'AB12CD34')).resolves.toBe(true);
    expect(userRepository.consumeBackupCodeHash).toHaveBeenCalledWith('user-1', 'hash-b', ['hash-a']);
  });

  it('returns false when another request consumes the same backup code first', async () => {
    vi.mocked(getStoredFactorState).mockResolvedValue({
      mfaEnabled: true,
      totpSecret: 'totp-secret',
      pendingTotpSecret: null,
      backupCodes: ['hash-a'],
      mfaGraceExpiresAt: null,
      passkeysRegistered: 0,
    });
    compareMock.mockResolvedValue(true);
    vi.mocked(userRepository.consumeBackupCodeHash).mockResolvedValue(false);

    await expect(consumeBackupCode('user-1', 'AB12CD34')).resolves.toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  deriveEnrolledMethodsFromState,
  deriveLoginMethodsFromState,
  deriveMfaEnabledFromState,
  type StoredFactorState,
} from '@modules/supporting/auth/application/mfa-state.service';

function makeState(overrides: Partial<StoredFactorState> = {}): StoredFactorState {
  return {
    mfaEnabled: false,
    totpSecret: null,
    pendingTotpSecret: null,
    backupCodes: [],
    mfaGraceExpiresAt: null,
    passkeysRegistered: 0,
    ...overrides,
  };
}

describe('mfa-state helpers', () => {
  it('returns no enrolled methods when no primary factor exists', () => {
    const state = makeState({ backupCodes: ['hashed-code'] });

    expect(deriveEnrolledMethodsFromState(state)).toEqual([]);
    expect(deriveMfaEnabledFromState(state)).toBe(false);
    expect(deriveLoginMethodsFromState(state)).toEqual(['backup_code']);
  });

  it('treats TOTP as a primary MFA method', () => {
    const state = makeState({ totpSecret: 'totp-secret' });

    expect(deriveEnrolledMethodsFromState(state)).toEqual(['totp']);
    expect(deriveMfaEnabledFromState(state)).toBe(true);
    expect(deriveLoginMethodsFromState(state)).toEqual(['totp']);
  });

  it('treats passkeys as a primary MFA method', () => {
    const state = makeState({ passkeysRegistered: 2 });

    expect(deriveEnrolledMethodsFromState(state)).toEqual(['webauthn']);
    expect(deriveMfaEnabledFromState(state)).toBe(true);
    expect(deriveLoginMethodsFromState(state)).toEqual(['webauthn']);
  });

  it('returns both primary methods plus backup codes when available', () => {
    const state = makeState({
      totpSecret: 'totp-secret',
      passkeysRegistered: 1,
      backupCodes: ['hashed-code'],
      pendingTotpSecret: 'pending-secret',
    });

    expect(deriveEnrolledMethodsFromState(state)).toEqual(['totp', 'webauthn']);
    expect(deriveMfaEnabledFromState(state)).toBe(true);
    expect(deriveLoginMethodsFromState(state)).toEqual(['totp', 'webauthn', 'backup_code']);
  });
});

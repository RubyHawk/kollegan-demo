import { userRepository } from '../infrastructure/user.repository';

export type EnrolledPrimaryMfaMethod = 'totp' | 'webauthn';
export type LoginMfaMethod = EnrolledPrimaryMfaMethod | 'backup_code';

export interface StoredFactorState {
  mfaEnabled: boolean;
  totpSecret: string | null;
  pendingTotpSecret: string | null;
  backupCodes: string[];
  mfaGraceExpiresAt: Date | null;
  passkeysRegistered: number;
}

export interface MfaStatus {
  enabled: boolean;
  totpConfigured: boolean;
  pendingTotpSetup: boolean;
  passkeysRegistered: number;
  backupCodesRemaining: number;
  enrolledMethods: EnrolledPrimaryMfaMethod[];
  loginMethods: LoginMfaMethod[];
  graceExpiresAt: Date | null;
}

export function deriveEnrolledMethodsFromState(state: StoredFactorState): EnrolledPrimaryMfaMethod[] {
  const methods: EnrolledPrimaryMfaMethod[] = [];
  if (state.totpSecret) methods.push('totp');
  if (state.passkeysRegistered > 0) methods.push('webauthn');
  return methods;
}

export function deriveMfaEnabledFromState(state: StoredFactorState): boolean {
  return deriveEnrolledMethodsFromState(state).length > 0;
}

export function deriveLoginMethodsFromState(state: StoredFactorState): LoginMfaMethod[] {
  const methods: LoginMfaMethod[] = [...deriveEnrolledMethodsFromState(state)];
  if (state.backupCodes.length > 0) methods.push('backup_code');
  return methods;
}

function toStatus(state: StoredFactorState): MfaStatus {
  return {
    enabled: deriveMfaEnabledFromState(state),
    totpConfigured: !!state.totpSecret,
    pendingTotpSetup: !!state.pendingTotpSecret,
    passkeysRegistered: state.passkeysRegistered,
    backupCodesRemaining: state.backupCodes.length,
    enrolledMethods: deriveEnrolledMethodsFromState(state),
    loginMethods: deriveLoginMethodsFromState(state),
    graceExpiresAt: state.mfaGraceExpiresAt,
  };
}

export async function getStoredFactorState(userId: string): Promise<StoredFactorState | null> {
  return userRepository.findFactorState(userId);
}

export async function syncMfaState(userId: string): Promise<MfaStatus> {
  const state = await getStoredFactorState(userId);
  if (!state) {
    return {
      enabled: false,
      totpConfigured: false,
      pendingTotpSetup: false,
      passkeysRegistered: 0,
      backupCodesRemaining: 0,
      enrolledMethods: [],
      loginMethods: [],
      graceExpiresAt: null,
    };
  }

  const enabled = deriveMfaEnabledFromState(state);
  if (state.mfaEnabled !== enabled) {
    await userRepository.updateMfaFields(userId, { mfaEnabled: enabled });
    state.mfaEnabled = enabled;
  }

  return toStatus(state);
}

export async function getMfaStatus(userId: string): Promise<MfaStatus> {
  return syncMfaState(userId);
}

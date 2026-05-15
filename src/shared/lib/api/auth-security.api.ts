import { apiDelete, apiGet, apiPost } from '../api-client';

const AUTH_BASE_URL = '/api/v1/auth';

interface Envelope<T> {
  data: T;
}

export type SecurityMfaMethod = 'totp' | 'webauthn' | 'backup_code';

export interface SecurityMfaStatus {
  enabled: boolean;
  totpConfigured: boolean;
  pendingTotpSetup: boolean;
  passkeysRegistered: number;
  backupCodesRemaining: number;
  enrolledMethods: Array<'totp' | 'webauthn'>;
  loginMethods: SecurityMfaMethod[];
  graceExpiresAt: string | null;
  currentSessionMfaAuthenticated: boolean;
}

export interface TotpSetupPayload {
  qrDataUrl: string;
  secret: string;
  otpAuthUrl?: string;
}

export interface PasskeyRecord {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ActiveSessionRecord {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  issuedAt: string;
  expiresAt: string;
  mfaMethod: 'totp' | 'webauthn' | null;
  mfaVerifiedAt: string | null;
}

export async function getSecurityMfaStatus(): Promise<SecurityMfaStatus> {
  const res = await apiGet<Envelope<SecurityMfaStatus>>(`${AUTH_BASE_URL}/mfa/status`, { cache: 'no-store' });
  return res.data;
}

export async function setupTotp() {
  const res = await apiPost<Envelope<TotpSetupPayload>>(`${AUTH_BASE_URL}/mfa/setup`);
  return res.data;
}

export async function enableTotp(code: string) {
  const res = await apiPost<Envelope<{ backupCodes: string[]; message?: string }>>(`${AUTH_BASE_URL}/mfa/enable`, { code });
  return res.data;
}

export async function removeTotp() {
  const res = await apiPost<Envelope<{ message?: string }>>(`${AUTH_BASE_URL}/mfa/disable`);
  return res.data;
}

export async function regenerateBackupCodes() {
  const res = await apiPost<Envelope<{ backupCodes: string[]; message?: string }>>(`${AUTH_BASE_URL}/mfa/backup-codes/regenerate`);
  return res.data;
}

export async function listActiveSessions() {
  const res = await apiGet<Envelope<{ sessions: ActiveSessionRecord[] }>>(`${AUTH_BASE_URL}/sessions`, { cache: 'no-store' });
  return res.data.sessions;
}

export async function startPasskeyRegistration() {
  const res = await apiPost<Envelope<unknown>>(`${AUTH_BASE_URL}/webauthn/register/options`);
  return res.data;
}

export async function finishPasskeyRegistration(response: unknown, name: string) {
  const res = await apiPost<Envelope<{ credentialId: string; message?: string }>>(`${AUTH_BASE_URL}/webauthn/register/verify`, {
    response,
    name,
  });
  return res.data;
}

export async function listPasskeys() {
  const res = await apiGet<Envelope<{ credentials: PasskeyRecord[] }>>(`${AUTH_BASE_URL}/webauthn/credentials`, { cache: 'no-store' });
  return res.data.credentials;
}

export async function deletePasskey(id: string) {
  await apiDelete(`${AUTH_BASE_URL}/webauthn/credentials/${id}`);
}

export async function resetUserMfaRecovery(payload: { userId: string; reason: string }) {
  const res = await apiPost<Envelope<{ message: string; graceExpiresAt: string }>>(`${AUTH_BASE_URL}/mfa/recovery/reset`, payload);
  return res.data;
}

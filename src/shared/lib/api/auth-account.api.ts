import { apiGet, apiPatch, apiPost } from '../api-client';

const AUTH_BASE_URL = '/api/v1/auth';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ThemeFontSize = 'small' | 'medium' | 'large';

export interface UserProfile {
  id?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  themeMode?: ThemeMode | string | null;
  themeAccent?: string | null;
  themeFontFamily?: string | null;
  themeFontSize?: ThemeFontSize | string | null;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  themeMode?: ThemeMode;
  themeAccent?: string;
  themeFontFamily?: string;
  themeFontSize?: ThemeFontSize;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Envelope<T> {
  data: T;
}

export async function updateProfile(payload: UpdateProfilePayload) {
  await apiPatch<{ ok: true }>(`${AUTH_BASE_URL}/profile`, payload);
}

export async function getProfile() {
  const res = await apiGet<Envelope<UserProfile>>(`${AUTH_BASE_URL}/profile`, { cache: 'no-store' });
  return res.data;
}

export async function changePassword(payload: ChangePasswordPayload) {
  await apiPost<{ ok: true }>(`${AUTH_BASE_URL}/change-password`, payload);
}

export async function setupMfa() {
  const res = await apiPost<Envelope<{ qrDataUrl: string; secret: string; otpAuthUrl?: string }>>(
    `${AUTH_BASE_URL}/mfa/setup`,
  );
  return res.data;
}

export async function enableMfa(code: string) {
  const res = await apiPost<Envelope<{ backupCodes: string[]; message?: string }>>(`${AUTH_BASE_URL}/mfa/enable`, {
    code,
  });
  return res.data;
}

export async function disableMfa(code: string) {
  const res = await apiPost<Envelope<{ message?: string }>>(`${AUTH_BASE_URL}/mfa/disable`, { code });
  return res.data;
}

export async function logout() {
  await apiPost<{ ok?: true }>(`${AUTH_BASE_URL}/logout`);
}

import { apiGet, apiPatch } from '../api-client';

const AUTH_PROFILE_URL = '/api/v1/auth/profile';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ThemeFontSize = 'small' | 'medium' | 'large';

interface Envelope<T> {
  data: T;
}

// Internal UI theme preferences live on the auth profile today.
// Keep them behind a dedicated branding/theming client so browser code does
// not couple directly to the broader account API surface.
export interface ThemeProfile {
  themeMode?: ThemeMode | string | null;
  themeAccent?: string | null;
  themeFontFamily?: string | null;
  themeFontSize?: ThemeFontSize | string | null;
  organizationThemeMode?: ThemeMode | string | null;
  organizationThemeAccent?: string | null;
  organizationThemeFontFamily?: string | null;
  organizationThemeFontSize?: ThemeFontSize | string | null;
}

export interface UpdateThemePreferencesPayload {
  themeMode?: ThemeMode;
  themeAccent?: string;
  themeFontFamily?: string;
  themeFontSize?: ThemeFontSize;
}

export async function getThemeProfile() {
  const res = await apiGet<Envelope<ThemeProfile>>(AUTH_PROFILE_URL, { cache: 'no-store' });
  return res.data;
}

export async function updateThemePreferences(payload: UpdateThemePreferencesPayload) {
  await apiPatch<{ ok: true }>(AUTH_PROFILE_URL, payload);
}

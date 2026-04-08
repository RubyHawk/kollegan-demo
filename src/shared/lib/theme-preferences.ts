export const THEME_STORAGE_KEYS = {
  mode: 'theme',
  accent: 'accentColor',
  data: 'themeData',
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
} as const;

export const THEME_COOKIE_KEYS = {
  mode: 'ui_theme',
  accent: 'ui_accent',
  fontFamily: 'ui_font_family',
  fontSize: 'ui_font_size',
} as const;

export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

export function setThemePreferenceCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function getThemePreferenceCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const parts = document.cookie ? document.cookie.split('; ') : [];
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length));
    }
  }
  return null;
}

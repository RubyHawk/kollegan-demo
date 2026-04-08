'use client';

import { useEffect } from 'react';
import {
  FONT_OPTIONS,
  FONT_SIZE_SCALES,
  THEMES,
  type FontSize,
  type ThemeMode,
} from '../../app/(dashboard)/(shell)/installningar/_components/theme-data';
import {
  getThemePreferenceCookie,
  setThemePreferenceCookie,
  THEME_COOKIE_KEYS,
  THEME_STORAGE_KEYS,
} from '@shared/lib/theme-preferences';

const DEFAULT_THEME = THEMES.find((item) => item.id === 'soleria') ?? THEMES[0];
const VALID_THEME_MODES: Record<ThemeMode, true> = {
  light: true,
  dark: true,
  auto: true,
};

function injectStyle(id: string, css: string) {
  let node = document.getElementById(id) as HTMLStyleElement | null;
  if (!node) {
    node = document.createElement('style');
    node.id = id;
    document.head.appendChild(node);
  }
  node.textContent = css;
}

function getStoredValue(storageKey: string, cookieKey: string) {
  try {
    const localValue = localStorage.getItem(storageKey);
    if (localValue) return localValue;
  } catch {
    // ignore storage failures
  }
  return getThemePreferenceCookie(cookieKey);
}

function persistLocally(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

function getFontSizeCss(scale: number) {
  if (scale === 1) {
    return '.text-xs, .text-sm, .text-base, .text-lg, .text-xl, .text-2xl, .text-3xl { transition: font-size 150ms ease-out, line-height 150ms ease-out; }';
  }

  return [
    '.text-xs, .text-sm, .text-base, .text-lg, .text-xl, .text-2xl, .text-3xl { transition: font-size 150ms ease-out, line-height 150ms ease-out; }',
    `.text-xs { font-size: ${(0.75 * scale).toFixed(4)}rem !important; line-height: ${(1 * scale).toFixed(4)}rem !important; }`,
    `.text-sm { font-size: ${(0.875 * scale).toFixed(4)}rem !important; line-height: ${(1.25 * scale).toFixed(4)}rem !important; }`,
    `.text-base { font-size: ${(1 * scale).toFixed(4)}rem !important; line-height: ${(1.5 * scale).toFixed(4)}rem !important; }`,
    `.text-lg { font-size: ${(1.125 * scale).toFixed(4)}rem !important; line-height: ${(1.75 * scale).toFixed(4)}rem !important; }`,
    `.text-xl { font-size: ${(1.25 * scale).toFixed(4)}rem !important; line-height: ${(1.75 * scale).toFixed(4)}rem !important; }`,
    `.text-2xl { font-size: ${(1.5 * scale).toFixed(4)}rem !important; line-height: ${(2 * scale).toFixed(4)}rem !important; }`,
    `.text-3xl { font-size: ${(1.875 * scale).toFixed(4)}rem !important; line-height: ${(2.25 * scale).toFixed(4)}rem !important; }`,
  ].join('\n');
}

function applyResolvedThemePreferences({
  mode,
  accent,
  fontFamily,
  fontSize,
}: {
  mode?: string | null;
  accent?: string | null;
  fontFamily?: string | null;
  fontSize?: string | null;
}) {
  const themeMode: ThemeMode = mode && mode in VALID_THEME_MODES
    ? (mode as ThemeMode)
    : 'light';
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && prefersDark);

  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.setAttribute('data-theme-mode', themeMode);
  persistLocally(THEME_STORAGE_KEYS.mode, themeMode);
  setThemePreferenceCookie(THEME_COOKIE_KEYS.mode, themeMode);

  const selectedTheme = THEMES.find((item) => item.id === accent) ?? DEFAULT_THEME;
  const vars = isDark ? selectedTheme.dark : selectedTheme.light;

  document.documentElement.setAttribute('data-accent-theme', selectedTheme.id);
  for (const [prop, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(prop, value);
  }
  persistLocally(THEME_STORAGE_KEYS.accent, selectedTheme.id);
  persistLocally(THEME_STORAGE_KEYS.data, JSON.stringify({ light: selectedTheme.light, dark: selectedTheme.dark }));
  setThemePreferenceCookie(THEME_COOKIE_KEYS.accent, selectedTheme.id);

  const selectedFont = FONT_OPTIONS.find((item) => item.id === fontFamily) ?? FONT_OPTIONS[0];
  injectStyle(
    'font-family-override',
    selectedFont.id === 'inter' ? '' : `body { font-family: ${selectedFont.css} !important; }`,
  );
  persistLocally(THEME_STORAGE_KEYS.fontFamily, selectedFont.id);
  setThemePreferenceCookie(THEME_COOKIE_KEYS.fontFamily, selectedFont.id);

  const normalizedFontSize = fontSize && fontSize in FONT_SIZE_SCALES ? fontSize as FontSize : 'medium';
  const scale = FONT_SIZE_SCALES[normalizedFontSize] ?? FONT_SIZE_SCALES.medium;
  injectStyle('font-size-override', getFontSizeCss(scale));
  persistLocally(THEME_STORAGE_KEYS.fontSize, normalizedFontSize);
  setThemePreferenceCookie(THEME_COOKIE_KEYS.fontSize, normalizedFontSize);
}

function applyPersistedThemePreferences() {
  const themeModeValue = getStoredValue(THEME_STORAGE_KEYS.mode, THEME_COOKIE_KEYS.mode);
  const accentId = getStoredValue(THEME_STORAGE_KEYS.accent, THEME_COOKIE_KEYS.accent) ?? DEFAULT_THEME.id;
  const fontFamily = getStoredValue(THEME_STORAGE_KEYS.fontFamily, THEME_COOKIE_KEYS.fontFamily) ?? 'inter';
  const fontSize = getStoredValue(THEME_STORAGE_KEYS.fontSize, THEME_COOKIE_KEYS.fontSize) ?? 'medium';
  applyResolvedThemePreferences({
    mode: themeModeValue,
    accent: accentId,
    fontFamily,
    fontSize,
  });
}

export function ThemeBootstrap() {
  useEffect(() => {
    applyPersistedThemePreferences();

    void fetch('/api/auth/profile', { cache: 'no-store', credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json() as {
          data?: {
            themeMode?: string | null;
            themeAccent?: string | null;
            themeFontFamily?: string | null;
            themeFontSize?: string | null;
          };
        };
        return payload.data ?? null;
      })
      .then((profile) => {
        if (!profile) return;
        applyResolvedThemePreferences({
          mode: profile.themeMode,
          accent: profile.themeAccent,
          fontFamily: profile.themeFontFamily,
          fontSize: profile.themeFontSize,
        });
      })
      .catch(() => {
        // ignore auth/profile failures
      });

    const handlePageShow = () => applyPersistedThemePreferences();
    const handleStorage = () => applyPersistedThemePreferences();
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const handleMediaChange = () => applyPersistedThemePreferences();

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('storage', handleStorage);
    if (media?.addEventListener) media.addEventListener('change', handleMediaChange);
    else if (media?.addListener) media.addListener(handleMediaChange);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('storage', handleStorage);
      if (media?.removeEventListener) media.removeEventListener('change', handleMediaChange);
      else if (media?.removeListener) media.removeListener(handleMediaChange);
    };
  }, []);

  return null;
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { updateProfile } from '@shared/lib/api/auth-account.api';
import {
  DEFAULT_THEME_ID,
  THEMES,
  FONT_SIZE_SCALES,
  FONT_OPTIONS,
  THEME_PROPS,
  type ThemeDef,
  type ThemeMode,
  type FontSize,
  type FontOption,
} from '../_components/theme-data';
import { THEME_COOKIE_KEYS, setThemePreferenceCookie, THEME_STORAGE_KEYS } from '@shared/lib/theme-preferences';
import { AppearanceSettingsView, FONT_SIZE_OPTIONS } from './appearance-settings-sections';
import { OrganizationThemeSettingsCard } from './organization-theme-settings-card';

const DEFAULT_THEME = THEMES.find((item) => item.id === DEFAULT_THEME_ID) ?? THEMES[0];

function persistAppearancePatch(patch: {
  themeMode?: ThemeMode;
  themeAccent?: string;
  themeFontFamily?: string;
  themeFontSize?: FontSize;
}) {
  void updateProfile(patch).catch(() => {
    // ignore background persistence failures
  });
}

export default function UtseendePage() {
  const [theme, setTheme] = useState<ThemeMode>('auto');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [selectedTheme, setSelectedTheme] = useState<string>(DEFAULT_THEME.id);
  const [fontFamily, setFontFamily] = useState<string>('inter');
  const [resolvedDark, setResolvedDark] = useState(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEYS.mode) as ThemeMode | null;
      const nextTheme =
        storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'auto'
          ? storedTheme
          : 'light';
      setTheme(nextTheme);

      const storedFontSize = localStorage.getItem(THEME_STORAGE_KEYS.fontSize) as FontSize | null;
      if (storedFontSize) applyFontSize(storedFontSize);

      const storedAccent = localStorage.getItem(THEME_STORAGE_KEYS.accent);
      const matchedTheme = THEMES.find((item) => item.id === storedAccent) ?? DEFAULT_THEME;
      setSelectedTheme(matchedTheme.id);

      const isDark =
        nextTheme === 'dark' ||
        (nextTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setResolvedDark(isDark);
      document.documentElement.classList.toggle('dark', isDark);

      const vars = isDark ? matchedTheme.dark : matchedTheme.light;
      for (const [prop, value] of Object.entries(vars)) {
        document.documentElement.style.setProperty(prop, value);
      }

      localStorage.setItem(THEME_STORAGE_KEYS.mode, nextTheme);
      localStorage.setItem(THEME_STORAGE_KEYS.accent, matchedTheme.id);
      localStorage.setItem(THEME_STORAGE_KEYS.data, JSON.stringify({ light: matchedTheme.light, dark: matchedTheme.dark }));
      setThemePreferenceCookie(THEME_COOKIE_KEYS.mode, nextTheme);
      setThemePreferenceCookie(THEME_COOKIE_KEYS.accent, matchedTheme.id);

      const storedFont = localStorage.getItem(THEME_STORAGE_KEYS.fontFamily);
      if (storedFont) {
        const matchedFont = FONT_OPTIONS.find((item) => item.id === storedFont);
        if (matchedFont) applyFont(matchedFont);
      }
    } catch {
      // ignore local preference errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearThemeInlineStyles() {
    const root = document.documentElement;
    for (const prop of THEME_PROPS) root.style.removeProperty(prop);
  }

  function reapplyThemeForMode(isDark: boolean) {
    const selected = THEMES.find((item) => item.id === selectedTheme);
    if (!selected) return;

    clearThemeInlineStyles();
    const vars = isDark ? selected.dark : selected.light;
    for (const [prop, value] of Object.entries(vars)) {
      document.documentElement.style.setProperty(prop, value);
    }
  }

  function applyTheme(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    try {
      const isDark: boolean =
        nextTheme === 'dark' ||
        (nextTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      localStorage.setItem(THEME_STORAGE_KEYS.mode, nextTheme);
      setThemePreferenceCookie(THEME_COOKIE_KEYS.mode, nextTheme);
      persistAppearancePatch({ themeMode: nextTheme });

      document.documentElement.classList.toggle('dark', isDark);
      setResolvedDark(isDark);
      reapplyThemeForMode(isDark);
    } catch {
      // ignore theme persistence errors
    }
  }

  function applySelectedTheme(nextTheme: ThemeDef) {
    setSelectedTheme(nextTheme.id);
    try {
      clearThemeInlineStyles();
      const isDark = document.documentElement.classList.contains('dark');
      const vars = isDark ? nextTheme.dark : nextTheme.light;
      for (const [prop, value] of Object.entries(vars)) {
        document.documentElement.style.setProperty(prop, value);
      }
      localStorage.setItem(THEME_STORAGE_KEYS.accent, nextTheme.id);
      localStorage.setItem(THEME_STORAGE_KEYS.data, JSON.stringify({ light: nextTheme.light, dark: nextTheme.dark }));
      setThemePreferenceCookie(THEME_COOKIE_KEYS.accent, nextTheme.id);
      persistAppearancePatch({ themeAccent: nextTheme.id });
    } catch {
      // ignore theme persistence errors
    }
  }

  function injectStyle(id: string, css: string) {
    let node = document.getElementById(id) as HTMLStyleElement | null;
    if (!node) {
      node = document.createElement('style');
      node.id = id;
      document.head.appendChild(node);
    }
    node.textContent = css;
  }

  function applyFont(nextFont: FontOption) {
    setFontFamily(nextFont.id);
    try {
      injectStyle(
        'font-family-override',
        nextFont.id === 'inter' ? '' : `body { font-family: ${nextFont.css} !important; }`,
      );
      localStorage.setItem(THEME_STORAGE_KEYS.fontFamily, nextFont.id);
      setThemePreferenceCookie(THEME_COOKIE_KEYS.fontFamily, nextFont.id);
      persistAppearancePatch({ themeFontFamily: nextFont.id });
    } catch {
      // ignore font persistence errors
    }
  }

  function applyFontSize(nextSize: FontSize) {
    setFontSize(nextSize);
    const scale = FONT_SIZE_SCALES[nextSize];
    const scrollContainer = document.querySelector('main.flex-1.overflow-y-auto') as HTMLElement | null;
    const scrollTop = scrollContainer?.scrollTop ?? window.scrollY;
    try {
      injectStyle('font-size-override', scale === 1 ? `
        .text-xs, .text-sm, .text-base, .text-lg, .text-xl, .text-2xl, .text-3xl {
          transition: font-size 150ms ease-out, line-height 150ms ease-out;
        }
      ` : `
        .text-xs, .text-sm, .text-base, .text-lg, .text-xl, .text-2xl, .text-3xl {
          transition: font-size 150ms ease-out, line-height 150ms ease-out;
        }
        .text-xs { font-size: ${(0.75 * scale).toFixed(4)}rem !important; line-height: ${(1 * scale).toFixed(4)}rem !important; }
        .text-sm { font-size: ${(0.875 * scale).toFixed(4)}rem !important; line-height: ${(1.25 * scale).toFixed(4)}rem !important; }
        .text-base { font-size: ${(1 * scale).toFixed(4)}rem !important; line-height: ${(1.5 * scale).toFixed(4)}rem !important; }
        .text-lg { font-size: ${(1.125 * scale).toFixed(4)}rem !important; line-height: ${(1.75 * scale).toFixed(4)}rem !important; }
        .text-xl { font-size: ${(1.25 * scale).toFixed(4)}rem !important; line-height: ${(1.75 * scale).toFixed(4)}rem !important; }
        .text-2xl { font-size: ${(1.5 * scale).toFixed(4)}rem !important; line-height: ${(2 * scale).toFixed(4)}rem !important; }
        .text-3xl { font-size: ${(1.875 * scale).toFixed(4)}rem !important; line-height: ${(2.25 * scale).toFixed(4)}rem !important; }
      `);
      localStorage.setItem(THEME_STORAGE_KEYS.fontSize, nextSize);
      setThemePreferenceCookie(THEME_COOKIE_KEYS.fontSize, nextSize);
      persistAppearancePatch({ themeFontSize: nextSize });
      const restoreScroll = () => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollTop;
          return;
        }
        window.scrollTo(0, scrollTop);
      };
      window.requestAnimationFrame(() => {
        restoreScroll();
        window.requestAnimationFrame(restoreScroll);
      });
      window.setTimeout(restoreScroll, 120);
      window.setTimeout(restoreScroll, 260);
    } catch {
      // ignore font-size persistence errors
    }
  }

  function save() {
    setPending(true);
    setTimeout(() => {
      setPending(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    }, 420);
  }

  const activeTheme = useMemo(
    () => THEMES.find((item) => item.id === selectedTheme) ?? DEFAULT_THEME,
    [selectedTheme],
  );

  const activeFont = useMemo(
    () => FONT_OPTIONS.find((item) => item.id === fontFamily) ?? FONT_OPTIONS[0],
    [fontFamily],
  );

  const activeFontSize = useMemo(
    () => FONT_SIZE_OPTIONS.find((item) => item.id === fontSize) ?? FONT_SIZE_OPTIONS[1],
    [fontSize],
  );

  return (
    <div className="space-y-5">
      <AppearanceSettingsView
        theme={theme}
        fontSize={fontSize}
        selectedTheme={selectedTheme}
        fontFamily={fontFamily}
        resolvedDark={resolvedDark}
        pending={pending}
        saved={saved}
        activeTheme={activeTheme}
        activeFont={activeFont}
        activeFontSize={activeFontSize}
        applyTheme={applyTheme}
        applySelectedTheme={applySelectedTheme}
        applyFont={applyFont}
        applyFontSize={applyFontSize}
        save={save}
      />
      <OrganizationThemeSettingsCard />
    </div>
  );
}

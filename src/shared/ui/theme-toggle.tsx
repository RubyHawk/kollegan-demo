'use client';

import { useSyncExternalStore } from 'react';
import { SunIcon, MoonIcon } from '@shared/ui/icons';
import { THEMES } from '../../app/(dashboard)/(shell)/installningar/_components/theme-data';
import { THEME_COOKIE_KEYS, THEME_STORAGE_KEYS, setThemePreferenceCookie } from '@shared/lib/theme-preferences';

const DEFAULT_THEME = THEMES.find((item) => item.id === 'soleria') ?? THEMES[0];

export default function ThemeToggle({ className }: { className?: string }) {
  const dark = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {};

      const observer = new MutationObserver(() => onStoreChange());
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      return () => observer.disconnect();
    },
    () => {
      if (typeof window === 'undefined') return false;
      return document.documentElement.classList.contains('dark');
    },
    () => false,
  );

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    const accentId = localStorage.getItem(THEME_STORAGE_KEYS.accent) ?? DEFAULT_THEME.id;
    const selectedTheme = THEMES.find((item) => item.id === accentId) ?? DEFAULT_THEME;
    const vars = next ? selectedTheme.dark : selectedTheme.light;
    for (const [prop, value] of Object.entries(vars)) {
      document.documentElement.style.setProperty(prop, value);
    }
    localStorage.setItem(THEME_STORAGE_KEYS.mode, next ? 'dark' : 'light');
    localStorage.setItem(THEME_STORAGE_KEYS.data, JSON.stringify({ light: selectedTheme.light, dark: selectedTheme.dark }));
    setThemePreferenceCookie(THEME_COOKIE_KEYS.mode, next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Byt till ljust läge' : 'Byt till mörkt läge'}
      className={className ?? 'w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all hover:shadow-sm text-[var(--text-secondary)]'}
    >
      {dark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </button>
  );
}

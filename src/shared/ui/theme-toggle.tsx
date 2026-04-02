'use client';

import { useSyncExternalStore } from 'react';
import { SunIcon, MoonIcon } from '@shared/ui/icons';

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
    localStorage.setItem('theme', next ? 'dark' : 'light');
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

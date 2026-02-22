'use client';

import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@shared/ui/icons';

export default function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

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

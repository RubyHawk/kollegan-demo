'use client';

import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { SPRING_SNAPPY } from '@shared/lib/motion';
import { Icon, SaveButton } from '../_components/shared';
import {
  THEMES,
  FONT_OPTIONS,
  THEME_PROPS,
  type ThemeDef,
  type ThemeMode,
  type FontSize,
  type FontOption,
} from '../_components/theme-data';

const FONT_SIZE_OPTIONS: { id: FontSize; label: string; sample: string }[] = [
  { id: 'small', label: 'Liten', sample: 'Aa' },
  { id: 'medium', label: 'Normal', sample: 'Aa' },
  { id: 'large', label: 'Stor', sample: 'Aa' },
];

const MODE_OPTIONS: { id: ThemeMode; label: string; desc: string }[] = [
  { id: 'light', label: 'Ljust', desc: 'Alltid ljust läge' },
  { id: 'dark', label: 'Mörkt', desc: 'Alltid mörkt läge' },
  { id: 'auto', label: 'Auto', desc: 'Följer systemet' },
];

function CompactPreview({ theme }: { theme: ThemeDef }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex h-28">
        <div
          className="w-20 border-r border-black/5"
          style={{ background: `linear-gradient(180deg, ${theme.light['--surface-2']}, ${theme.light['--surface-3']})` }}
        />
        <div
          className="flex flex-1 flex-col gap-2 p-4"
          style={{ background: `linear-gradient(180deg, ${theme.light['--page-bg']}, ${theme.light['--surface']})` }}
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded-full" style={{ backgroundColor: theme.light['--text-muted'] }} />
            <div className="flex gap-1.5">
              {theme.swatches.slice(0, 3).map((color) => (
                <div key={color} className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <div className="h-9 rounded-2xl" style={{ backgroundColor: theme.light['--surface-alt'] }} />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-10 rounded-2xl" style={{ backgroundColor: theme.light['--surface-alt'] }} />
            <div className="h-10 rounded-2xl" style={{ backgroundColor: theme.light['--surface-3'] }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UtseendePage() {
  const [theme, setTheme] = useState<ThemeMode>('auto');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [selectedTheme, setSelectedTheme] = useState<string>('claude');
  const [fontFamily, setFontFamily] = useState<string>('inter');
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('theme') as ThemeMode | null;
      setTheme(storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'auto');

      const storedFontSize = localStorage.getItem('fontSize') as FontSize | null;
      if (storedFontSize) applyFontSize(storedFontSize);

      const storedAccent = localStorage.getItem('accentColor');
      const matchedTheme = THEMES.find((item) => item.id === storedAccent);
      if (matchedTheme) {
        setSelectedTheme(matchedTheme.id);
        const isDark = document.documentElement.classList.contains('dark');
        const vars = isDark ? matchedTheme.dark : matchedTheme.light;
        for (const [prop, value] of Object.entries(vars)) {
          document.documentElement.style.setProperty(prop, value);
        }
      }

      const storedFont = localStorage.getItem('fontFamily');
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
      let isDark: boolean;
      if (nextTheme === 'auto') {
        localStorage.removeItem('theme');
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        localStorage.setItem('theme', nextTheme);
        isDark = nextTheme === 'dark';
      }

      document.documentElement.classList.toggle('dark', isDark);
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
      localStorage.setItem('accentColor', nextTheme.id);
      localStorage.setItem('themeData', JSON.stringify({ light: nextTheme.light, dark: nextTheme.dark }));
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
      localStorage.setItem('fontFamily', nextFont.id);
    } catch {
      // ignore font persistence errors
    }
  }

  function applyFontSize(nextSize: FontSize) {
    setFontSize(nextSize);
    const scales: Record<FontSize, number> = { small: 0.875, medium: 1, large: 1.125 };
    const scale = scales[nextSize];
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
      localStorage.setItem('fontSize', nextSize);
    } catch {
      // ignore font-size persistence errors
    }
  }

  function save() {
    setPending(true);
    setTimeout(() => {
      setPending(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    }, 450);
  }

  const activeTheme = useMemo(
    () => THEMES.find((item) => item.id === selectedTheme) ?? THEMES[0],
    [selectedTheme],
  );

  return (
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]"
      >
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-0)] p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Tema</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Välj läge och accent utan att behöva bläddra genom stora kort.</p>
            </div>
            <span className="rounded-full bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
              {activeTheme.label}
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {MODE_OPTIONS.map((mode) => {
              const active = theme === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => applyTheme(mode.id)}
                  className={cn(
                    'rounded-2xl border px-3 py-3 text-left transition-colors',
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent)]/8'
                      : 'border-[var(--border)] hover:bg-[var(--surface-alt)]',
                  )}
                >
                  <p className="text-sm font-medium text-[var(--text-primary)]">{mode.label}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{mode.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Accent</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{activeTheme.desc}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEMES.map((item) => {
                const active = item.id === selectedTheme;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => applySelectedTheme(item)}
                    className={cn(
                      'relative rounded-2xl border px-3 py-3 text-left transition-all',
                      active
                        ? 'border-[var(--accent)] bg-[var(--accent)]/8 shadow-sm'
                        : 'border-[var(--border)] hover:bg-[var(--surface-alt)]',
                    )}
                  >
                    <div className="mb-2 flex gap-1.5">
                      {item.swatches.slice(0, 4).map((swatch) => (
                        <div key={swatch} className="h-4 w-4 rounded-full border border-black/5" style={{ backgroundColor: swatch }} />
                      ))}
                    </div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
                    <AnimatePresence>
                      {active && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={SPRING_SNAPPY}
                          className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white"
                        >
                          <Icon path={<polyline points="20 6 9 17 4 12" />} size={10} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.03, ease: 'easeOut' }}
          className="space-y-5"
        >
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-0)] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Förhandsvisning</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">En snabb känsla för hur gränssnittet kommer att se ut.</p>
              </div>
              <span className="rounded-full bg-[var(--surface-alt)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                {theme === 'auto' ? 'Auto' : theme === 'dark' ? 'Mörkt' : 'Ljust'}
              </span>
            </div>
            <div className="mt-4">
              <CompactPreview theme={activeTheme} />
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-0)] p-5 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Typografi</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Håll font och textstorlek samlade på ett ställe.</p>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {FONT_OPTIONS.map((font) => {
                const active = font.id === fontFamily;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => applyFont(font)}
                    className={cn(
                      'rounded-2xl border px-3 py-3 text-left transition-colors',
                      active
                        ? 'border-[var(--accent)] bg-[var(--accent)]/8'
                        : 'border-[var(--border)] hover:bg-[var(--surface-alt)]',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-medium text-[var(--text-primary)]" style={font.sampleStyle}>Aa</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{font.label}</p>
                        <p className="truncate text-xs text-[var(--text-muted)]">{font.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Textstorlek</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {FONT_SIZE_OPTIONS.map((size) => {
                  const active = fontSize === size.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => applyFontSize(size.id)}
                      className={cn(
                        'rounded-2xl border px-3 py-3 text-center transition-colors',
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent)]/8'
                          : 'border-[var(--border)] hover:bg-[var(--surface-alt)]',
                      )}
                    >
                      <p
                        className={cn(
                          'font-medium text-[var(--text-primary)]',
                          size.id === 'small' && 'text-sm',
                          size.id === 'medium' && 'text-base',
                          size.id === 'large' && 'text-lg',
                        )}
                      >
                        {size.sample}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{size.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      <div className="flex justify-end rounded-3xl border border-[var(--border)] bg-[var(--surface-0)] px-5 py-4 shadow-sm">
        <SaveButton pending={pending} saved={saved} onClick={save} />
      </div>
    </div>
  );
}

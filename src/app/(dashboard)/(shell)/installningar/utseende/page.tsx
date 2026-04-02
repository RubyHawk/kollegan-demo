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

const FONT_SIZE_OPTIONS: { id: FontSize; label: string; desc: string }[] = [
  { id: 'small', label: 'Liten', desc: 'Mer information på skärmen' },
  { id: 'medium', label: 'Normal', desc: 'Balanserad läsbarhet' },
  { id: 'large', label: 'Stor', desc: 'Lugnare och tydligare' },
];

const MODE_OPTIONS: { id: ThemeMode; label: string; desc: string }[] = [
  { id: 'light', label: 'Ljust', desc: 'Rent och luftigt hela dagen' },
  { id: 'dark', label: 'Mörkt', desc: 'Dämpat och fokusvänligt' },
  { id: 'auto', label: 'Auto', desc: 'Följer din enhet' },
];

function WorkspacePreview({
  theme,
  dark,
  fontLabel,
  sizeLabel,
}: {
  theme: ThemeDef;
  dark: boolean;
  fontLabel: string;
  sizeLabel: string;
}) {
  const vars = dark ? theme.dark : theme.light;

  return (
    <div
      className="overflow-hidden rounded-[28px] border p-4 shadow-[0_24px_60px_rgba(0,0,0,0.12)]"
      style={{
        borderColor: vars['--border'],
        background: `linear-gradient(180deg, ${vars['--surface-0']}, ${vars['--surface-1']})`,
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
        <div
          className="rounded-[22px] border p-3"
          style={{ borderColor: vars['--border'], background: vars['--surface'] }}
        >
          <div className="space-y-2.5">
            {['Översikt', 'Offerter', 'Mallar', 'Produkter'].map((item, index) => (
              <div
                key={item}
                className="rounded-2xl px-3 py-2 text-[11px] font-medium"
                style={{
                  background: index === 0 ? vars['--accent-subtle'] : vars['--surface-alt'],
                  color: index === 0 ? vars['--accent'] : vars['--text-secondary'],
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div
            className="rounded-[22px] border p-4"
            style={{ borderColor: vars['--border'], background: vars['--surface'] }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: vars['--text-muted'] }}>
                  Förhandsvisning
                </p>
                <h4 className="mt-2 text-lg font-semibold" style={{ color: vars['--text-primary'] }}>
                  Soleria-offerter
                </h4>
              </div>
              <div className="flex gap-2">
                {theme.swatches.slice(0, 3).map((swatch) => (
                  <span key={swatch} className="h-3.5 w-3.5 rounded-full" style={{ background: swatch }} />
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
              <div
                className="rounded-[20px] p-3"
                style={{ background: vars['--surface-alt'], color: vars['--text-secondary'] }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="h-3 w-20 rounded-full" style={{ background: vars['--text-muted'], opacity: 0.35 }} />
                  <div className="rounded-full px-2 py-1 text-[10px] font-medium" style={{ background: vars['--accent-subtle'], color: vars['--accent'] }}>
                    {sizeLabel}
                  </div>
                </div>
                <div className="space-y-2">
                  {[62, 88, 74].map((height, index) => (
                    <motion.div
                      key={height}
                      initial={{ scaleY: 0.7, opacity: 0.6 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ duration: 0.35, delay: 0.05 * index, ease: 'easeOut' }}
                      className="origin-bottom rounded-2xl"
                      style={{
                        height,
                        background: index === 1 ? vars['--accent'] : vars['--surface-3'],
                        opacity: index === 1 ? 0.88 : 0.72,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div
                  className="rounded-[20px] p-3"
                  style={{ background: vars['--surface-alt'], color: vars['--text-secondary'] }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: vars['--text-muted'] }}>
                    Typografi
                  </p>
                  <p className="mt-2 text-base font-semibold" style={{ color: vars['--text-primary'] }}>{fontLabel}</p>
                  <p className="mt-1 text-sm" style={{ color: vars['--text-secondary'] }}>Lättläst och konsekvent</p>
                </div>
                <div
                  className="rounded-[20px] p-3"
                  style={{ background: vars['--surface-alt'], color: vars['--text-secondary'] }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: vars['--accent'] }} />
                    <span className="text-sm font-medium" style={{ color: vars['--text-primary'] }}>Accent i fokus</span>
                  </div>
                  <div className="h-2.5 rounded-full" style={{ background: vars['--surface-3'] }}>
                    <motion.div
                      initial={{ width: '35%' }}
                      animate={{ width: '72%' }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: vars['--accent'] }}
                    />
                  </div>
                </div>
              </div>
            </div>
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
      setTimeout(() => setSaved(false), 2200);
    }, 420);
  }

  const activeTheme = useMemo(
    () => THEMES.find((item) => item.id === selectedTheme) ?? THEMES[0],
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

  const previewIsDark = theme === 'dark' || (theme === 'auto' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(135deg,var(--surface-0),var(--surface-1))] shadow-[0_20px_48px_rgba(0,0,0,0.08)]"
      >
        <div className="p-5 sm:p-6 lg:p-7">
          <div className="max-w-3xl">
            <span className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-subtle)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Utseende
            </span>
            <h2 className="mt-4 text-[28px] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[34px]">
              Gör arbetsytan lugnare, varmare och tydligare.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              Välj ett uttryck som känns premium utan att störa jobbet. Förhandsvisningen uppdateras direkt så att du ser resultatet innan du sparar.
            </p>
          </div>

          <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <div className="grid gap-4 xl:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Visningsläge</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Välj om arbetsytan ska kännas ljus, mörk eller följa enheten.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {MODE_OPTIONS.map((mode) => {
                    const active = theme === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => applyTheme(mode.id)}
                        className={cn(
                          'rounded-2xl border px-4 py-3 text-left transition-all',
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent)]/8 shadow-[0_10px_22px_rgba(0,0,0,0.05)]'
                            : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]',
                        )}
                      >
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{mode.label}</p>
                        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{mode.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Textstorlek</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Håll läsbarheten konsekvent utan att lägga plats på onödiga kort.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {FONT_SIZE_OPTIONS.map((size) => {
                    const active = fontSize === size.id;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => applyFontSize(size.id)}
                        className={cn(
                          'flex min-h-[84px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all',
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent)]/8 shadow-[0_10px_22px_rgba(0,0,0,0.05)]'
                            : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]',
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{size.label}</p>
                          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{size.desc}</p>
                        </div>
                        <span className={cn('font-semibold text-[var(--text-primary)]', size.id === 'small' && 'text-sm', size.id === 'medium' && 'text-base', size.id === 'large' && 'text-lg')}>
                          Aa
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.03, ease: 'easeOut' }}
        className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-0),var(--surface-1))] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.08)] sm:p-6"
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--surface-alt)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
            {activeTheme.label}
          </span>
          <span className="rounded-full bg-[var(--surface-alt)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
            {activeFont.label}
          </span>
          <span className="rounded-full bg-[var(--surface-alt)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
            {activeFontSize.label}
          </span>
        </div>

        <WorkspacePreview
          theme={activeTheme}
          dark={previewIsDark}
          fontLabel={activeFont.label}
          sizeLabel={activeFontSize.label}
        />
      </motion.section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.03, ease: 'easeOut' }}
          className="rounded-[30px] border border-[var(--border)] bg-[var(--surface-0)] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.07)] sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Accentpaletter</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Varje palett justerar ytor, kontrast och accentfärg som ett sammanhållet paket.</p>
            </div>
            <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--accent)]">
              Aktiv: {activeTheme.label}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {THEMES.map((item, index) => {
              const active = item.id === selectedTheme;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => applySelectedTheme(item)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.02, ease: 'easeOut' }}
                  className={cn(
                    'relative overflow-hidden rounded-[24px] border p-4 text-left transition-all',
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent)]/8 shadow-[0_18px_38px_rgba(0,0,0,0.08)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{item.desc}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {item.swatches.slice(0, 4).map((swatch) => (
                        <span key={swatch} className="h-3.5 w-3.5 rounded-full border border-black/5" style={{ background: swatch }} />
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-[0.7fr_1fr] overflow-hidden rounded-[18px] border border-[var(--border)]">
                    <div className="h-16" style={{ background: item.light['--surface-2'] }} />
                    <div className="space-y-2 p-3" style={{ background: item.light['--surface'] }}>
                      <div className="h-2.5 w-16 rounded-full" style={{ background: item.light['--text-muted'], opacity: 0.32 }} />
                      <div className="h-2.5 w-24 rounded-full" style={{ background: item.light['--surface-3'] }} />
                      <div className="h-2.5 w-20 rounded-full" style={{ background: item.light['--accent'], opacity: 0.7 }} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {active && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={SPRING_SNAPPY}
                        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-white"
                      >
                        <Icon path={<polyline points="20 6 9 17 4 12" />} size={12} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.05, ease: 'easeOut' }}
          className="rounded-[30px] border border-[var(--border)] bg-[var(--surface-0)] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.07)] sm:p-6"
        >
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Typsnitt</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Välj ett tydligt uttryck utan att layouten blir orolig.</p>
          </div>

          <div className="mt-5 space-y-2">
            {FONT_OPTIONS.map((font, index) => {
              const active = font.id === fontFamily;
              return (
                <motion.button
                  key={font.id}
                  type="button"
                  onClick={() => applyFont(font)}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, delay: index * 0.02, ease: 'easeOut' }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition-all',
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent)]/8 shadow-[0_14px_28px_rgba(0,0,0,0.06)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]',
                  )}
                >
                  <span className="min-w-[34px] text-xl font-medium text-[var(--text-primary)]" style={font.sampleStyle}>Aa</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{font.label}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{font.desc}</p>
                  </div>
                  <span className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border text-[11px]',
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                      : 'border-[var(--border)] text-[var(--text-muted)]',
                  )}>
                    {active ? '✓' : ''}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>
      </div>

      <div className="flex justify-end rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)] px-5 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.07)]">
        <SaveButton pending={pending} saved={saved} onClick={save} />
      </div>
    </div>
  );
}

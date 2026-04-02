'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { SPRING_SNAPPY } from '@shared/lib/motion';
import { Icon, SaveButton } from '../_components/shared';
import { THEMES, FONT_OPTIONS, THEME_PROPS, type ThemeDef, type ThemeMode, type FontSize, type FontOption } from '../_components/theme-data';

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
      if (storedTheme === 'light' || storedTheme === 'dark') setTheme(storedTheme);
      else setTheme('auto');

      const storedFs = localStorage.getItem('fontSize') as FontSize | null;
      if (storedFs) applyFontSize(storedFs);

      const storedAccent = localStorage.getItem('accentColor');
      const matchedTheme = THEMES.find((c) => c.id === storedAccent);
      if (matchedTheme) {
        setSelectedTheme(matchedTheme.id);
        const isDark = document.documentElement.classList.contains('dark');
        const vars = isDark ? matchedTheme.dark : matchedTheme.light;
        for (const [prop, val] of Object.entries(vars)) {
          document.documentElement.style.setProperty(prop, val);
        }
      }

      const storedFont = localStorage.getItem('fontFamily');
      if (storedFont) {
        const f = FONT_OPTIONS.find((o) => o.id === storedFont);
        if (f) applyFont(f);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearThemeInlineStyles() {
    const root = document.documentElement;
    for (const prop of THEME_PROPS) root.style.removeProperty(prop);
  }

  function reapplyThemeForMode(isDark: boolean) {
    const t = THEMES.find((x) => x.id === selectedTheme);
    if (!t) return;
    clearThemeInlineStyles();
    const root = document.documentElement;
    const vars = isDark ? t.dark : t.light;
    for (const [prop, val] of Object.entries(vars)) {
      root.style.setProperty(prop, val);
    }
  }

  function applyTheme(t: ThemeMode) {
    setTheme(t);
    try {
      let isDark: boolean;
      if (t === 'auto') {
        localStorage.removeItem('theme');
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        localStorage.setItem('theme', t);
        isDark = t === 'dark';
      }
      document.documentElement.classList.toggle('dark', isDark);
      reapplyThemeForMode(isDark);
    } catch { /* ignore */ }
  }

  function applySelectedTheme(t: ThemeDef) {
    setSelectedTheme(t.id);
    try {
      clearThemeInlineStyles();
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');
      const vars = isDark ? t.dark : t.light;
      for (const [prop, val] of Object.entries(vars)) {
        root.style.setProperty(prop, val);
      }
      localStorage.setItem('accentColor', t.id);
      localStorage.setItem('themeData', JSON.stringify({ light: t.light, dark: t.dark }));
    } catch { /* ignore */ }
  }

  function injectStyle(id: string, css: string) {
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = css;
  }

  function applyFont(f: FontOption) {
    setFontFamily(f.id);
    try {
      injectStyle('font-family-override',
        f.id === 'inter' ? '' : `body { font-family: ${f.css} !important; }`
      );
      localStorage.setItem('fontFamily', f.id);
    } catch { /* ignore */ }
  }

  function applyFontSize(f: FontSize) {
    setFontSize(f);
    const scales: Record<FontSize, number> = { small: 0.875, medium: 1, large: 1.125 };
    const s = scales[f];
    try {
      injectStyle('font-size-override', s === 1 ? `
        .text-xs, .text-sm, .text-base, .text-lg, .text-xl, .text-2xl, .text-3xl {
          transition: font-size 150ms ease-out, line-height 150ms ease-out;
        }
      ` : `
        .text-xs, .text-sm, .text-base, .text-lg, .text-xl, .text-2xl, .text-3xl {
          transition: font-size 150ms ease-out, line-height 150ms ease-out;
        }
        .text-xs   { font-size: ${(0.75  * s).toFixed(4)}rem !important; line-height: ${(1     * s).toFixed(4)}rem !important; }
        .text-sm   { font-size: ${(0.875 * s).toFixed(4)}rem !important; line-height: ${(1.25  * s).toFixed(4)}rem !important; }
        .text-base { font-size: ${(1     * s).toFixed(4)}rem !important; line-height: ${(1.5   * s).toFixed(4)}rem !important; }
        .text-lg   { font-size: ${(1.125 * s).toFixed(4)}rem !important; line-height: ${(1.75  * s).toFixed(4)}rem !important; }
        .text-xl   { font-size: ${(1.25  * s).toFixed(4)}rem !important; line-height: ${(1.75  * s).toFixed(4)}rem !important; }
        .text-2xl  { font-size: ${(1.5   * s).toFixed(4)}rem !important; line-height: ${(2     * s).toFixed(4)}rem !important; }
        .text-3xl  { font-size: ${(1.875 * s).toFixed(4)}rem !important; line-height: ${(2.25  * s).toFixed(4)}rem !important; }
      `);
      localStorage.setItem('fontSize', f);
    } catch { /* ignore */ }
  }

  function save() {
    setPending(true);
    setTimeout(() => {
      setPending(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2800);
    }, 500);
  }

  const modes: { id: ThemeMode; label: string; desc: string }[] = [
    { id: 'light', label: 'Ljust', desc: 'Alltid ljust läge' },
    { id: 'dark', label: 'Mörkt', desc: 'Alltid mörkt läge' },
    { id: 'auto', label: 'Auto', desc: 'Följer systeminställning' },
  ];

  const fontSizes: { id: FontSize; label: string }[] = [
    { id: 'small', label: 'Liten' },
    { id: 'medium', label: 'Normal' },
    { id: 'large', label: 'Stor' },
  ];

  function ModePreview({ mode }: { mode: ThemeMode }) {
    const light = (
      <>
        <div className="w-7 shrink-0 rounded-l-md" style={{ backgroundColor: 'oklch(0.94 0.02 290)' }} />
        <div className="flex-1 flex flex-col gap-[3px] p-2" style={{ backgroundColor: 'oklch(0.98 0.01 290)' }}>
          <div className="h-[3px] w-3/4 rounded-full" style={{ backgroundColor: 'oklch(0.80 0.04 285 / 0.5)' }} />
          <div className="h-[3px] w-1/2 rounded-full" style={{ backgroundColor: 'oklch(0.80 0.04 285 / 0.3)' }} />
          <div className="h-[3px] w-2/3 rounded-full" style={{ backgroundColor: 'oklch(0.80 0.04 285 / 0.2)' }} />
        </div>
      </>
    );
    const dark = (
      <>
        <div className="w-7 shrink-0 rounded-l-md" style={{ backgroundColor: 'oklch(0.22 0.02 285)' }} />
        <div className="flex-1 flex flex-col gap-[3px] p-2" style={{ backgroundColor: 'oklch(0.17 0.01 285)' }}>
          <div className="h-[3px] w-3/4 rounded-full" style={{ backgroundColor: 'oklch(0.40 0.08 285 / 0.4)' }} />
          <div className="h-[3px] w-1/2 rounded-full bg-white/8" />
          <div className="h-[3px] w-2/3 rounded-full bg-white/5" />
        </div>
      </>
    );
    if (mode === 'light') return <div className="flex h-full w-full rounded-md overflow-hidden">{light}</div>;
    if (mode === 'dark') return <div className="flex h-full w-full rounded-md overflow-hidden">{dark}</div>;
    return (
      <div className="flex h-full w-full rounded-md overflow-hidden">
        <div className="w-7 shrink-0 rounded-l-md" style={{ background: 'linear-gradient(to bottom, oklch(0.94 0.02 290), oklch(0.22 0.02 285))' }} />
        <div className="flex-1 flex flex-col gap-[3px] p-2" style={{ background: 'linear-gradient(to bottom, oklch(0.98 0.01 290), oklch(0.17 0.01 285))' }}>
          <div className="h-[3px] w-3/4 rounded-full" style={{ backgroundColor: 'oklch(0.65 0.04 285 / 0.4)' }} />
          <div className="h-[3px] w-1/2 rounded-full" style={{ backgroundColor: 'oklch(0.65 0.04 285 / 0.25)' }} />
          <div className="h-[3px] w-2/3 rounded-full" style={{ backgroundColor: 'oklch(0.65 0.04 285 / 0.15)' }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Läge */}
      <div className="pb-6">
        <div className="mb-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Läge</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Välj hur appen visas.</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {modes.map((m) => {
            const selected = theme === m.id;
            return (
              <button
                key={m.id}
                onClick={() => applyTheme(m.id)}
                className={cn(
                  'relative rounded-lg border-2 overflow-hidden text-left transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40',
                  selected ? 'border-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--text-muted)]/40',
                )}
              >
                <div className="h-16 w-full"><ModePreview mode={m.id} /></div>
                <div className="px-3 py-2.5">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{m.label}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{m.desc}</p>
                </div>
                <AnimatePresence>
                  {selected && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={SPRING_SNAPPY}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                      <Icon path={<polyline points="20 6 9 17 4 12"/>} size={10} className="text-white" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--border-light)]" />

      {/* Färgtema */}
      <div className="py-6">
        <div className="mb-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Färgtema</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Sätter tonen för hela gränssnittet.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {THEMES.map((t) => {
            const selected = selectedTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => applySelectedTheme(t)}
                className={cn(
                  'relative rounded-lg border-2 p-3 text-left transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40',
                  selected ? 'border-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--text-muted)]/40',
                )}
              >
                <div className="flex gap-1 mb-2.5">
                  {t.swatches.map((s, i) => (
                    <div key={i} className="w-5 h-5 rounded-full" style={{ backgroundColor: s }} />
                  ))}
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{t.label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.desc}</p>
                <AnimatePresence>
                  {selected && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={SPRING_SNAPPY}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                      <Icon path={<polyline points="20 6 9 17 4 12"/>} size={10} className="text-white" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--border-light)]" />

      {/* Typsnitt */}
      <div className="py-6">
        <div className="mb-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Typsnitt</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Välj typsnitt för gränssnittet.</p>
        </div>
        <div className="mt-3 rounded-lg border border-[var(--border)] divide-y divide-[var(--border-light)] overflow-hidden">
          {FONT_OPTIONS.map((f) => {
            const selected = fontFamily === f.id;
            return (
              <button
                key={f.id}
                onClick={() => applyFont(f)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-100 focus:outline-none',
                  selected ? 'bg-[var(--accent)]/5' : 'hover:bg-[var(--surface-hover)]',
                )}
              >
                <span className={cn('w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors', selected ? 'border-[var(--accent)]' : 'border-[var(--border)]')}>
                  {selected && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }} className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
                </span>
                <span className="text-base font-medium text-[var(--text-primary)] w-8" style={f.sampleStyle}>Aa</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{f.label}</span>
                <span className="text-xs text-[var(--text-muted)] ml-auto">{f.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--border-light)]" />

      {/* Textstorlek */}
      <div className="py-6">
        <div className="mb-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Textstorlek</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Justera storleken på all text.</p>
        </div>
        <div className="mt-5 px-1">
          <div className="relative h-6 flex items-center">
            <div className="absolute inset-x-0 h-[3px] rounded-full bg-[var(--border)]" />
            <div className="absolute left-0 h-[3px] rounded-full bg-[var(--accent)] transition-all duration-200" style={{ width: fontSize === 'small' ? '0%' : fontSize === 'medium' ? '50%' : '100%' }} />
            {fontSizes.map((fs, idx) => {
              const active = fontSize === fs.id;
              const left = idx === 0 ? '0%' : idx === 1 ? '50%' : '100%';
              return (
                <button key={fs.id} onClick={() => applyFontSize(fs.id)} className="absolute -translate-x-1/2 focus:outline-none group" style={{ left }}>
                  <div className={cn('rounded-full transition-all duration-150 border-[3px] border-[var(--surface-0)]', active ? 'w-5 h-5 bg-[var(--accent)] shadow-sm' : 'w-3.5 h-3.5 bg-[var(--border)] group-hover:bg-[var(--text-muted)]')} />
                </button>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            {fontSizes.map((fs) => (
              <span key={fs.id} className={cn('text-xs', fontSize === fs.id ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-muted)]', fs.id === 'medium' && 'text-center', fs.id === 'large' && 'text-right')}>
                {fs.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-light)]" />

      <div className="flex justify-end pt-5">
        <SaveButton pending={pending} saved={saved} onClick={save} />
      </div>
    </div>
  );
}

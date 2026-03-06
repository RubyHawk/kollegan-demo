'use client';

/**
 * Settings UI — full client component for the /settings route.
 *
 * Tabs: Profil · Utseende · Anslutningar · Säkerhet
 *
 * Design language:
 *  - Horizontal underline tab bar at top (scrollable on mobile)
 *  - All cards: border border-[var(--border)] on every state
 *  - Smooth tab content fade via Framer Motion
 *  - Save action shows success feedback inline (demo — no real API call)
 *  - Appearance tab: live theme switching, accent color palette, font family
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { SPRING_SNAPPY, EASE_SPRING } from '@shared/lib/motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProps {
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface SettingsClientProps {
  user: UserProps;
}

type Tab = 'profil' | 'utseende' | 'anslutningar' | 'sakerhet';

type ThemeMode = 'light' | 'dark' | 'auto';
type FontSize  = 'small' | 'medium' | 'large';

// ─── Utility: inline icon SVGs ────────────────────────────────────────────────

function Icon({ path, size = 16, className }: { path: React.ReactNode; size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      {path}
    </svg>
  );
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'profil',
    label: 'Profil',
    icon: <Icon path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />,
  },
  {
    id: 'utseende',
    label: 'Utseende',
    icon: <Icon path={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>} />,
  },
  {
    id: 'anslutningar',
    label: 'Anslutningar',
    icon: <Icon path={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>} />,
  },
  {
    id: 'sakerhet',
    label: 'Säkerhet',
    icon: <Icon path={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>} />,
  },
];

// ─── Small components ─────────────────────────────────────────────────────────

function FieldLabel({ children, description }: { children: React.ReactNode; description?: string }) {
  return (
    <div className="mb-1.5">
      <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
        {children}
      </label>
      {description && (
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{description}</p>
      )}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  readOnly,
  type = 'text',
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      readOnly={readOnly}
      className={cn(
        'w-full px-3 py-2.5 rounded-xl text-sm border',
        'bg-[var(--surface-0)] text-[var(--text-primary)]',
        'placeholder:text-[var(--text-muted)]',
        'outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50',
        'transition-colors duration-150',
        readOnly
          ? 'border-[var(--border-light)] text-[var(--text-muted)] cursor-default select-all'
          : 'border-[var(--border)] hover:border-[var(--text-muted)]/40',
      )}
    />
  );
}

function SectionCard({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border-light)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {description && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function SaveButton({ pending, saved, onClick }: { pending: boolean; saved: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onClick}
        disabled={pending}
        className={cn(
          'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
          'border focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40',
          pending
            ? 'bg-[var(--accent)]/60 border-[var(--accent)]/40 text-white cursor-wait'
            : saved
            ? 'bg-emerald-500 border-emerald-500/60 text-white'
            : 'bg-[var(--accent)] border-[var(--accent)] text-white hover:bg-[var(--accent-light)] hover:border-[var(--accent-light)]',
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={saved ? 'saved' : pending ? 'pending' : 'idle'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="flex items-center gap-1.5"
          >
            {saved ? (
              <>
                <Icon path={<><polyline points="20 6 9 17 4 12"/></>} size={13} />
                Sparat!
              </>
            ) : pending ? (
              'Sparar…'
            ) : (
              'Spara ändringar'
            )}
          </motion.span>
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-medium"
          >
            Ändringarna har sparats
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Profil tab ───────────────────────────────────────────────────────────────

function ProfilTab({ user }: { user: UserProps }) {
  const [firstName, setFirstName] = useState(user.firstName ?? '');
  const [lastName,  setLastName]  = useState(user.lastName ?? '');
  const [pending, setPending] = useState(false);
  const [saved,   setSaved]   = useState(false);

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || user.email;
  const initials = displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  function save() {
    setPending(true);
    setTimeout(() => {
      setPending(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2800);
    }, 700);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar + identity */}
      <SectionCard title="Profilinformation" description="Din synliga identitet inom Kollegan.">
        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-[var(--border-light)]">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center shadow-md">
              <span className="text-xl font-bold text-white">{initials}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[var(--surface-0)] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{displayName}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 capitalize">{user.role}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
              Din avatar genereras automatiskt från dina initialer.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <FieldLabel>Förnamn</FieldLabel>
            <Input value={firstName} onChange={setFirstName} placeholder="Ditt förnamn" />
          </div>
          <div>
            <FieldLabel>Efternamn</FieldLabel>
            <Input value={lastName} onChange={setLastName} placeholder="Ditt efternamn" />
          </div>
        </div>

        <SaveButton pending={pending} saved={saved} onClick={save} />
      </SectionCard>

      {/* Account info (read-only) */}
      <SectionCard title="Kontoinformation" description="Dessa uppgifter hanteras av din organisation och kan inte ändras här.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>E-postadress</FieldLabel>
            <Input value={user.email} readOnly />
          </div>
          <div>
            <FieldLabel>Roll</FieldLabel>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border-light)] bg-[var(--surface-0)]">
              <span className={cn(
                'px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide',
                user.role === 'admin'
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'bg-[var(--border-light)] text-[var(--text-secondary)]',
              )}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Utseende tab ─────────────────────────────────────────────────────────────

const ACCENT_COLORS = [
  { id: 'purple', label: 'Lila',    accent: '#6d28d9', light: '#7c3aed' },
  { id: 'indigo', label: 'Indigo',  accent: '#4338ca', light: '#4f46e5' },
  { id: 'blue',   label: 'Blå',     accent: '#1d4ed8', light: '#2563eb' },
  { id: 'teal',   label: 'Teal',    accent: '#0f766e', light: '#0d9488' },
  { id: 'rose',   label: 'Rosa',    accent: '#be123c', light: '#e11d48' },
  { id: 'orange', label: 'Orange',  accent: '#c2410c', light: '#ea580c' },
  { id: 'slate',  label: 'Grå',     accent: '#334155', light: '#475569' },
] as const;

type AccentColorId = typeof ACCENT_COLORS[number]['id'];

const FONT_OPTIONS = [
  {
    id: 'inter',
    label: 'Inter',
    desc: 'Modern sans-serif',
    sample: 'Aa',
    css: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
    sampleStyle: { fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' },
  },
  {
    id: 'system',
    label: 'System',
    desc: 'Systemets standardfont',
    sample: 'Aa',
    css: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    sampleStyle: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' },
  },
  {
    id: 'cormorant',
    label: 'Cormorant',
    desc: 'Elegant serif',
    sample: 'Aa',
    css: 'var(--font-cormorant), Georgia, serif',
    sampleStyle: { fontFamily: 'var(--font-cormorant), Georgia, serif' },
  },
] as const;

type FontId = typeof FONT_OPTIONS[number]['id'];

function UtseendeTab() {
  const [theme,       setTheme]       = useState<ThemeMode>('auto');
  const [fontSize,    setFontSize]    = useState<FontSize>('medium');
  const [accentColor, setAccentColor] = useState<AccentColorId>('purple');
  const [fontFamily,  setFontFamily]  = useState<FontId>('inter');
  const [pending, setPending] = useState(false);
  const [saved,   setSaved]   = useState(false);

  // Sync initial state from localStorage
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('theme') as ThemeMode | null;
      if (storedTheme === 'light' || storedTheme === 'dark') setTheme(storedTheme);
      else setTheme('auto');

      const storedFs = localStorage.getItem('fontSize') as FontSize | null;
      if (storedFs) applyFontSize(storedFs);

      const storedAccent = localStorage.getItem('accentColor') as AccentColorId | null;
      if (storedAccent && ACCENT_COLORS.some((c) => c.id === storedAccent)) setAccentColor(storedAccent);

      const storedFont = localStorage.getItem('fontFamily') as FontId | null;
      if (storedFont) {
        const f = FONT_OPTIONS.find((o) => o.id === storedFont);
        if (f) applyFont(f);
      }
    } catch { /* ignore */ }
  }, []);

  function applyTheme(t: ThemeMode) {
    setTheme(t);
    try {
      if (t === 'auto') {
        localStorage.removeItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      } else {
        localStorage.setItem('theme', t);
        document.documentElement.classList.toggle('dark', t === 'dark');
      }
    } catch { /* ignore */ }
  }

  function applyAccent(color: typeof ACCENT_COLORS[number]) {
    setAccentColor(color.id);
    try {
      document.documentElement.style.setProperty('--accent', color.accent);
      document.documentElement.style.setProperty('--accent-light', color.light);
      document.documentElement.style.setProperty('--accent-subtle', color.accent + '14');
      document.documentElement.style.setProperty('--accent-border', color.accent + '38');
      localStorage.setItem('accentColor', color.id);
      localStorage.setItem('accentHex', color.accent);
      localStorage.setItem('accentLightHex', color.light);
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

  function applyFont(f: typeof FONT_OPTIONS[number]) {
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
      injectStyle('font-size-override', s === 1 ? '' : `
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

  const themes: { id: ThemeMode; label: string; desc: string; preview: React.ReactNode }[] = [
    {
      id: 'light',
      label: 'Ljust',
      desc: 'Alltid ljust läge',
      preview: (
        <div className="w-full h-10 rounded-lg overflow-hidden border border-[var(--border-light)] flex">
          <div className="w-8 bg-[#f1eef9] border-r border-[#e4e0f5]" />
          <div className="flex-1 bg-[#fafafd] p-1.5 flex flex-col gap-1">
            <div className="h-1.5 w-3/4 rounded-full bg-[#ccc6e8]/60" />
            <div className="h-1.5 w-1/2 rounded-full bg-[#ccc6e8]/40" />
          </div>
        </div>
      ),
    },
    {
      id: 'dark',
      label: 'Mörkt',
      desc: 'Alltid mörkt läge',
      preview: (
        <div className="w-full h-10 rounded-lg overflow-hidden border border-[var(--border-light)] flex">
          <div className="w-8 bg-[#1a1528] border-r border-[#2d2245]" />
          <div className="flex-1 bg-[#13101e] p-1.5 flex flex-col gap-1">
            <div className="h-1.5 w-3/4 rounded-full bg-[#6d28d9]/40" />
            <div className="h-1.5 w-1/2 rounded-full bg-white/10" />
          </div>
        </div>
      ),
    },
    {
      id: 'auto',
      label: 'Auto',
      desc: 'Följer systeminställning',
      preview: (
        <div className="w-full h-10 rounded-lg overflow-hidden border border-[var(--border-light)] flex">
          <div className="w-8 bg-gradient-to-b from-[#f1eef9] to-[#1a1528] border-r border-[var(--border-light)]" />
          <div className="flex-1 bg-gradient-to-b from-[#fafafd] to-[#13101e] p-1.5 flex flex-col gap-1">
            <div className="h-1.5 w-3/4 rounded-full bg-[#ccc6e8]/50" />
            <div className="h-1.5 w-1/2 rounded-full bg-[#ccc6e8]/30" />
          </div>
        </div>
      ),
    },
  ];

  const fontSizes: { id: FontSize; label: string; sample: string }[] = [
    { id: 'small',  label: 'Liten',  sample: 'Aa' },
    { id: 'medium', label: 'Normal', sample: 'Aa' },
    { id: 'large',  label: 'Stor',   sample: 'Aa' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ── Tema ── */}
      <SectionCard title="Tema" description="Välj hur Kollegan visas. Auto-läget anpassar sig till ditt systems inställning.">
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTheme(t.id)}
              className={cn(
                'flex flex-col gap-2 p-3 rounded-xl border text-left transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40',
                theme === t.id
                  ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5 shadow-sm'
                  : 'border-[var(--border)] hover:border-[var(--accent)]/20 hover:bg-[var(--surface-hover)]',
              )}
            >
              {t.preview}
              <div className="flex items-center justify-between mt-0.5">
                <div>
                  <p className={cn('text-xs font-semibold', theme === t.id ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]')}>
                    {t.label}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{t.desc}</p>
                </div>
                {theme === t.id && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={SPRING_SNAPPY}
                    className="w-4 h-4 rounded-full bg-[var(--accent)] flex items-center justify-center shrink-0"
                  >
                    <Icon path={<polyline points="20 6 9 17 4 12"/>} size={9} className="text-white" />
                  </motion.span>
                )}
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* ── Accentfärg ── */}
      <SectionCard title="Accentfärg" description="Välj en accentfärg som används i hela gränssnittet — knappar, aktiva element och indikatorer.">
        <div className="flex gap-3 flex-wrap">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => applyAccent(c)}
              title={c.label}
              className={cn(
                'w-9 h-9 rounded-full border-2 transition-all duration-150 relative focus:outline-none focus:ring-2 focus:ring-offset-2',
                accentColor === c.id
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-transparent hover:scale-105 hover:shadow-md',
              )}
              style={{
                backgroundColor: c.accent,
                focusRingColor: c.accent,
              } as React.CSSProperties}
            >
              <AnimatePresence>
                {accentColor === c.id && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={SPRING_SNAPPY}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Icon path={<polyline points="20 6 9 17 4 12"/>} size={12} className="text-white drop-shadow" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <Icon path={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>} size={13} className="shrink-0 text-[var(--accent)]" />
          Vald: <span className="font-medium text-[var(--text-secondary)]">{ACCENT_COLORS.find((c) => c.id === accentColor)?.label}</span>
          — Ändringen tillämpas direkt.
        </div>
      </SectionCard>

      {/* ── Typografi ── */}
      <SectionCard title="Typografi" description="Anpassa typsnitt och textstorlek efter dina preferenser.">
        {/* Font family */}
        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          Typsnitt
        </p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => applyFont(f)}
              className={cn(
                'flex flex-col items-center gap-1.5 py-3 px-3 rounded-xl border transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40',
                fontFamily === f.id
                  ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5 shadow-sm'
                  : 'border-[var(--border)] hover:border-[var(--accent)]/20 hover:bg-[var(--surface-hover)]',
              )}
            >
              <span
                className="text-2xl font-semibold text-[var(--text-primary)]"
                style={f.sampleStyle}
              >
                {f.sample}
              </span>
              <div className="text-center">
                <p className={cn(
                  'text-xs font-semibold',
                  fontFamily === f.id ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]',
                )}>
                  {f.label}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{f.desc}</p>
              </div>
              {fontFamily === f.id && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={SPRING_SNAPPY}
                  className="w-4 h-4 rounded-full bg-[var(--accent)] flex items-center justify-center"
                >
                  <Icon path={<polyline points="20 6 9 17 4 12"/>} size={9} className="text-white" />
                </motion.span>
              )}
            </button>
          ))}
        </div>

        {/* Font size */}
        <div className="border-t border-[var(--border-light)] pt-3">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Textstorlek
          </p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {fontSizes.map((fs) => (
              <button
                key={fs.id}
                onClick={() => applyFontSize(fs.id)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border transition-all duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40',
                  fontSize === fs.id
                    ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5'
                    : 'border-[var(--border)] hover:border-[var(--accent)]/20 hover:bg-[var(--surface-hover)]',
                )}
              >
                <span className={cn(
                  'font-semibold text-[var(--text-secondary)]',
                  fs.id === 'small' ? 'text-sm' : fs.id === 'large' ? 'text-xl' : 'text-base',
                )}>
                  {fs.sample}
                </span>
                <span className={cn(
                  'text-[10px] font-medium',
                  fontSize === fs.id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
                )}>
                  {fs.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <SaveButton pending={pending} saved={saved} onClick={save} />
      </SectionCard>
    </div>
  );
}

// ─── Anslutningar tab ─────────────────────────────────────────────────────────

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  badge?: string;
}

function AnslutningarTab() {
  const [connections, setConnections] = useState<Record<string, boolean>>({
    github: false,
    google: false,
    slack: false,
    notion: false,
    zapier: false,
  });
  const [connecting, setConnecting] = useState<string | null>(null);

  function toggle(id: string) {
    if (connecting) return;
    if (connections[id]) {
      setConnections((prev) => ({ ...prev, [id]: false }));
      return;
    }
    setConnecting(id);
    setTimeout(() => {
      setConnections((prev) => ({ ...prev, [id]: true }));
      setConnecting(null);
    }, 900);
  }

  const integrations: Integration[] = [
    {
      id: 'github',
      name: 'GitHub',
      description: 'Synka repositories, issues och pull requests direkt i Kollegan.',
      connected: connections.github,
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-[var(--text-primary)]" aria-hidden="true">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
    },
    {
      id: 'google',
      name: 'Google Workspace',
      description: 'Importera kalender, kontakter och Drive-filer.',
      connected: connections.google,
      badge: 'Populär',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      ),
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Skicka notiser och uppdateringar till dina Slack-kanaler.',
      connected: connections.slack,
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zm2.521-10.123a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52h-2.52zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
        </svg>
      ),
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Exportera rapporter och data direkt till Notion-sidor.',
      connected: connections.notion,
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-[var(--text-primary)]" aria-hidden="true">
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
        </svg>
      ),
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Automatisera arbetsflöden med tusentals andra appar.',
      connected: connections.zapier,
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M12.003 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm-.065 5.52l2.19 3.815h4.373v2.338H14.13l-2.19 3.815-2.191-3.815H5.5V9.335h4.247zm-1.964 9.35l-.002.003-2.19 3.815H3.41v-2.34h3.123l2.19-3.813z" fill="#FF4A00"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Integrationer" description="Anslut Kollegan till de verktyg du redan använder.">
        <div className="flex flex-col divide-y divide-[var(--border-light)]">
          {integrations.map((integration, idx) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: idx * 0.04, ease: EASE_SPRING }}
              className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
            >
              {/* Icon box */}
              <div className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-center shrink-0">
                {integration.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{integration.name}</p>
                  {integration.badge && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-semibold">
                      {integration.badge}
                    </span>
                  )}
                  {integration.connected && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                      <span className="w-1 h-1 rounded-full bg-current" />
                      Ansluten
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{integration.description}</p>
              </div>

              {/* Toggle button */}
              <button
                onClick={() => toggle(integration.id)}
                disabled={connecting === integration.id}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 shrink-0',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40',
                  connecting === integration.id
                    ? 'border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface-alt)] cursor-wait'
                    : integration.connected
                    ? 'border-red-300/60 dark:border-red-700/40 text-red-500 hover:bg-red-500/5 hover:border-red-400/60'
                    : 'border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)]/5 hover:border-[var(--accent)]/60',
                )}
              >
                {connecting === integration.id ? 'Ansluter…' : integration.connected ? 'Koppla från' : 'Anslut'}
              </button>
            </motion.div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Säkerhet tab ─────────────────────────────────────────────────────────────

function SakerhetTab({ user }: { user: UserProps }) {
  const [mfaClicked, setMfaClicked] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      {/* Password */}
      <SectionCard title="Lösenord" description="Uppdatera ditt lösenord regelbundet för bättre säkerhet.">
        <div className="flex flex-col gap-4">
          <div>
            <FieldLabel>Nuvarande lösenord</FieldLabel>
            <Input value="••••••••••••" readOnly type="password" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Nytt lösenord</FieldLabel>
              <Input value="" onChange={() => {}} placeholder="Minst 12 tecken" type="password" />
            </div>
            <div>
              <FieldLabel>Bekräfta nytt lösenord</FieldLabel>
              <Input value="" onChange={() => {}} placeholder="Upprepa lösenordet" type="password" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] bg-[var(--surface-alt)] border border-[var(--border-light)] rounded-xl px-3 py-2.5">
            <Icon path={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>} size={13} className="shrink-0 text-[var(--accent)]" />
            Lösenordsändring är inaktiverad i demo-läge.
          </div>
        </div>
      </SectionCard>

      {/* MFA */}
      <SectionCard title="Tvåfaktorsautentisering" description="Lägg till ett extra lager av säkerhet till ditt konto.">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-center shrink-0">
              <Icon path={<><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>} size={18} className="text-[var(--text-secondary)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Autentiseringsapp</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Genererar tidsbegränsade engångskoder (TOTP)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded-md bg-[var(--border-light)] text-[var(--text-muted)] text-[10px] font-semibold uppercase tracking-wide">
              Ej aktiverad
            </span>
            <button
              onClick={() => setMfaClicked(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)]/5 hover:border-[var(--accent)]/60 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            >
              Aktivera
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mfaClicked && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: EASE_SPRING }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex items-center gap-2 text-[11px] text-[var(--accent)] bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-xl px-3 py-2.5">
                <Icon path={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>} size={13} className="shrink-0" />
                MFA-konfiguration är tillgänglig i produktionsmiljön.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      {/* Active session */}
      <SectionCard title="Aktiv session" description="Din nuvarande inloggningssession.">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)]">
          <div className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] flex items-center justify-center shrink-0">
            <Icon path={<><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>} size={14} className="text-[var(--text-secondary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--text-primary)]">Webbläsarsession</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{user.email} · Aktiv nu</p>
          </div>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold shrink-0">
            <span className="w-1 h-1 rounded-full bg-current" />
            Nu
          </span>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SettingsClient({ user }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('profil');

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="px-4 sm:px-8 py-6 max-w-3xl mx-auto w-full">
      {/* Page header */}
      <div className="mb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center shadow-md shrink-0">
            <span className="text-base font-bold text-white">{initials}</span>
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] leading-tight">
              Inställningar
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              Hantera din profil, utseende och säkerhet.
            </p>
          </div>
        </div>
      </div>

      {/* ── Horizontal tab bar ── */}
      <nav
        aria-label="Inställningssektioner"
        className="flex border-b border-[var(--border)] mb-5 overflow-x-auto scrollbar-none"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap shrink-0',
              'border-b-2 -mb-px transition-all duration-150',
              'focus:outline-none',
              activeTab === tab.id
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border)]',
            )}
          >
            <span className={cn(
              'shrink-0 transition-colors duration-150',
              activeTab === tab.id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
            )}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16, ease: EASE_SPRING }}
        >
          {activeTab === 'profil'        && <ProfilTab user={user} />}
          {activeTab === 'utseende'      && <UtseendeTab />}
          {activeTab === 'anslutningar'  && <AnslutningarTab />}
          {activeTab === 'sakerhet'      && <SakerhetTab user={user} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

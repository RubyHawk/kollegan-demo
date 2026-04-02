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

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { SPRING_SNAPPY, EASE_SPRING } from '@shared/lib/motion';
import { Tabs, TabsList, TabsTab, TabsPanel } from '@shared/ui/tabs';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProps {
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl?: string | null;
  role: string;
}

interface SettingsClientProps {
  user: UserProps;
}

type Tab = 'profil' | 'epost' | 'utseende' | 'anslutningar' | 'sakerhet';

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
    id: 'epost',
    label: 'E-post',
    icon: <Icon path={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>} />,
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
  const router = useRouter();
  const [firstName, setFirstName] = useState(user.firstName ?? '');
  const [lastName,  setLastName]  = useState(user.lastName ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl ?? null);
  const [pending,   setPending]   = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || user.email;
  const initials    = displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  function pickFile() { fileRef.current?.click(); }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Use FileReader so the image loads as a data: URI — blob: URIs are blocked by
    // the page's img-src CSP which only permits 'self', data:, and https:.
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string | undefined;
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => {
        const MAX = 400;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setAvatarUrl(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    // Reset so re-selecting the same file triggers onChange
    e.target.value = '';
  }

  async function save() {
    setPending(true); setError(null);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), avatarUrl }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(j.detail ?? `Fel ${res.status}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2800);
      router.refresh(); // re-fetch session so sidebar & header update
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar + identity */}
      <SectionCard title="Profilinformation" description="Din synliga identitet inom Soleria.">
        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-[var(--border-light)]">
          <div className="relative group">
            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
            {/* Avatar display */}
            <button
              type="button"
              onClick={pickFile}
              className="w-16 h-16 rounded-2xl overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
              title="Klicka för att byta profilbild"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{initials}</span>
                </div>
              )}
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </button>
            {/* Online dot */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[var(--surface-0)] flex items-center justify-center pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{displayName}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 capitalize">{user.role}</p>
            <button
              type="button"
              onClick={pickFile}
              className="mt-1.5 text-[11px] text-[var(--accent)] hover:underline"
            >
              {avatarUrl ? 'Byt profilbild' : 'Ladda upp profilbild'}
            </button>
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

        {error && (
          <p className="text-xs text-red-500 mb-3">{error}</p>
        )}
        <SaveButton pending={pending} saved={saved} onClick={() => void save()} />
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

// Full tweakcn-based themes — each overrides ALL design tokens for light & dark
interface ThemeDef {
  id: string;
  label: string;
  desc: string;
  swatches: string[];
  light: Record<string, string>;
  dark: Record<string, string>;
}

const THEMES: ThemeDef[] = [
  {
    id: 'claude',
    label: 'Claude',
    desc: 'Varm terracotta',
    swatches: ['#c96442', '#d97757', '#e9b8a0', '#e9e6dc', '#faf9f5'],
    light: {
      '--page-bg':        '#faf9f5',
      '--surface':        '#ffffff',
      '--surface-alt':    '#f3f0e8',
      '--surface-hover':  '#edeadf',
      '--surface-0':      '#ffffff',
      '--surface-1':      '#f7f5ed',
      '--surface-2':      '#f0ede4',
      '--surface-3':      '#e9e6dc',
      '--surface-active': '#e4e0d4',
      '--border':         '#d5d0c4',
      '--border-light':   '#e9e6dc',
      '--text-primary':   '#3d3929',
      '--text-secondary': '#6b6350',
      '--text-muted':     '#9c9480',
      '--accent':         '#c96442',
      '--accent-light':   '#d97757',
      '--accent-subtle':  'oklch(0.62 0.16 40 / 0.08)',
      '--accent-border':  'oklch(0.62 0.16 40 / 0.22)',
    },
    dark: {
      '--page-bg':        '#1a1915',
      '--surface':        '#262624',
      '--surface-alt':    '#2a2926',
      '--surface-hover':  '#33322e',
      '--surface-0':      '#262624',
      '--surface-1':      '#2a2926',
      '--surface-2':      '#302f2b',
      '--surface-3':      '#38362f',
      '--surface-active': '#3e3c34',
      '--border':         '#423f37',
      '--border-light':   '#33312b',
      '--text-primary':   '#e8e4d8',
      '--text-secondary': '#c3c0b6',
      '--text-muted':     '#8a8679',
      '--accent':         '#d97757',
      '--accent-light':   '#e09070',
      '--accent-subtle':  'oklch(0.68 0.15 42 / 0.1)',
      '--accent-border':  'oklch(0.68 0.15 42 / 0.22)',
    },
  },
  {
    id: 'catppuccin',
    label: 'Catppuccin',
    desc: 'Mjuk pastell lila',
    swatches: ['#8839ef', '#cba6f7', '#89dceb', '#f38ba8', '#a6e3a1'],
    light: {
      '--page-bg':        '#eff1f5',
      '--surface':        '#ffffff',
      '--surface-alt':    '#e6e9ef',
      '--surface-hover':  '#dce0e8',
      '--surface-0':      '#ffffff',
      '--surface-1':      '#eef0f5',
      '--surface-2':      '#e6e9ef',
      '--surface-3':      '#ccd0da',
      '--surface-active': '#bcc0cc',
      '--border':         '#ccd0da',
      '--border-light':   '#e6e9ef',
      '--text-primary':   '#4c4f69',
      '--text-secondary': '#6c6f85',
      '--text-muted':     '#8c8fa1',
      '--accent':         '#8839ef',
      '--accent-light':   '#a45bff',
      '--accent-subtle':  'oklch(0.55 0.24 310 / 0.08)',
      '--accent-border':  'oklch(0.55 0.24 310 / 0.22)',
    },
    dark: {
      '--page-bg':        '#1e1e2e',
      '--surface':        '#181825',
      '--surface-alt':    '#27273a',
      '--surface-hover':  '#313244',
      '--surface-0':      '#1e1e2e',
      '--surface-1':      '#232336',
      '--surface-2':      '#2a2a3e',
      '--surface-3':      '#313244',
      '--surface-active': '#45475a',
      '--border':         '#45475a',
      '--border-light':   '#313244',
      '--text-primary':   '#cdd6f4',
      '--text-secondary': '#bac2de',
      '--text-muted':     '#a6adc8',
      '--accent':         '#cba6f7',
      '--accent-light':   '#dbc1ff',
      '--accent-subtle':  'oklch(0.72 0.15 310 / 0.1)',
      '--accent-border':  'oklch(0.72 0.15 310 / 0.22)',
    },
  },
  {
    id: 'cosmic-night',
    label: 'Cosmic Night',
    desc: 'Djupt rymdlila',
    swatches: ['#6e56cf', '#a48fff', '#d8e6ff', '#ff5470', '#e4dfff'],
    light: {
      '--page-bg':        '#f5f5ff',
      '--surface':        '#ffffff',
      '--surface-alt':    '#eeeeff',
      '--surface-hover':  '#e8e6ff',
      '--surface-0':      '#ffffff',
      '--surface-1':      '#f5f5ff',
      '--surface-2':      '#eeeeff',
      '--surface-3':      '#e4dfff',
      '--surface-active': '#d8d2f8',
      '--border':         '#d4cff0',
      '--border-light':   '#e8e5f5',
      '--text-primary':   '#2a2a4a',
      '--text-secondary': '#504a72',
      '--text-muted':     '#7a7498',
      '--accent':         '#6e56cf',
      '--accent-light':   '#a48fff',
      '--accent-subtle':  'oklch(0.53 0.20 295 / 0.08)',
      '--accent-border':  'oklch(0.53 0.20 295 / 0.22)',
    },
    dark: {
      '--page-bg':        '#0f0f1a',
      '--surface':        '#18182a',
      '--surface-alt':    '#1e1e35',
      '--surface-hover':  '#282845',
      '--surface-0':      '#18182a',
      '--surface-1':      '#1c1c30',
      '--surface-2':      '#222240',
      '--surface-3':      '#2d2b55',
      '--surface-active': '#383670',
      '--border':         '#333366',
      '--border-light':   '#252548',
      '--text-primary':   '#e2e2f5',
      '--text-secondary': '#b8b5d8',
      '--text-muted':     '#8886b0',
      '--accent':         '#a48fff',
      '--accent-light':   '#bfaaff',
      '--accent-subtle':  'oklch(0.66 0.18 295 / 0.1)',
      '--accent-border':  'oklch(0.66 0.18 295 / 0.22)',
    },
  },
  {
    id: 'perpetuity',
    label: 'Perpetuity',
    desc: 'Fräsch teal',
    swatches: ['#06858e', '#4de8e8', '#c9e5e7', '#164955', '#e8f0f0'],
    light: {
      '--page-bg':        '#e8f0f0',
      '--surface':        '#ffffff',
      '--surface-alt':    '#dfe9ea',
      '--surface-hover':  '#d5e2e3',
      '--surface-0':      '#ffffff',
      '--surface-1':      '#eef4f4',
      '--surface-2':      '#e2ecec',
      '--surface-3':      '#d9eaea',
      '--surface-active': '#c9e5e7',
      '--border':         '#b0d0d4',
      '--border-light':   '#d9eaea',
      '--text-primary':   '#0a4a55',
      '--text-secondary': '#1a6a72',
      '--text-muted':     '#4a8a90',
      '--accent':         '#06858e',
      '--accent-light':   '#4de8e8',
      '--accent-subtle':  'oklch(0.58 0.12 195 / 0.08)',
      '--accent-border':  'oklch(0.58 0.12 195 / 0.22)',
    },
    dark: {
      '--page-bg':        '#0a1a20',
      '--surface':        '#0f2228',
      '--surface-alt':    '#132a32',
      '--surface-hover':  '#1a3540',
      '--surface-0':      '#0f2228',
      '--surface-1':      '#11262e',
      '--surface-2':      '#143038',
      '--surface-3':      '#164955',
      '--surface-active': '#1a5a68',
      '--border':         '#1a5060',
      '--border-light':   '#133540',
      '--text-primary':   '#e0f4f4',
      '--text-secondary': '#90d0d4',
      '--text-muted':     '#5aacb4',
      '--accent':         '#4de8e8',
      '--accent-light':   '#70f0f0',
      '--accent-subtle':  'oklch(0.82 0.12 190 / 0.1)',
      '--accent-border':  'oklch(0.82 0.12 190 / 0.22)',
    },
  },
  {
    id: 'nature',
    label: 'Nature',
    desc: 'Frisk och naturlig',
    swatches: ['#2e7d32', '#4caf50', '#81c784', '#c8e6c9', '#e8f5e9'],
    light: {
      '--page-bg':        '#f8f5f0',
      '--surface':        '#ffffff',
      '--surface-alt':    '#f0ece4',
      '--surface-hover':  '#e8e4db',
      '--surface-0':      '#ffffff',
      '--surface-1':      '#f5f2ec',
      '--surface-2':      '#eeebe3',
      '--surface-3':      '#e8f5e9',
      '--surface-active': '#c8e6c9',
      '--border':         '#c8c0b4',
      '--border-light':   '#e0dcd4',
      '--text-primary':   '#3e2723',
      '--text-secondary': '#5d4037',
      '--text-muted':     '#8d6e63',
      '--accent':         '#2e7d32',
      '--accent-light':   '#4caf50',
      '--accent-subtle':  'oklch(0.52 0.14 150 / 0.08)',
      '--accent-border':  'oklch(0.52 0.14 150 / 0.22)',
    },
    dark: {
      '--page-bg':        '#1c2a1f',
      '--surface':        '#1e2e22',
      '--surface-alt':    '#243328',
      '--surface-hover':  '#2d3e30',
      '--surface-0':      '#1e2e22',
      '--surface-1':      '#223226',
      '--surface-2':      '#28382c',
      '--surface-3':      '#3e4a3d',
      '--surface-active': '#4a5c48',
      '--border':         '#3e5040',
      '--border-light':   '#2a3c2e',
      '--text-primary':   '#f0ebe5',
      '--text-secondary': '#c8c0b4',
      '--text-muted':     '#8a9a80',
      '--accent':         '#4caf50',
      '--accent-light':   '#81c784',
      '--accent-subtle':  'oklch(0.62 0.16 145 / 0.1)',
      '--accent-border':  'oklch(0.62 0.16 145 / 0.22)',
    },
  },
  {
    id: 'mocha-mousse',
    label: 'Mocha Mousse',
    desc: 'Varm och jordnära',
    swatches: ['#A37764', '#C39E88', '#BAAB92', '#E4C7B8', '#F1F0E5'],
    light: {
      '--page-bg':        '#F1F0E5',
      '--surface':        '#ffffff',
      '--surface-alt':    '#EBE9DC',
      '--surface-hover':  '#E3E0D2',
      '--surface-0':      '#ffffff',
      '--surface-1':      '#F5F3E9',
      '--surface-2':      '#EBE9DC',
      '--surface-3':      '#E4C7B8',
      '--surface-active': '#DBBFAE',
      '--border':         '#D0C4B4',
      '--border-light':   '#E4DDD0',
      '--text-primary':   '#56453F',
      '--text-secondary': '#7A6A5E',
      '--text-muted':     '#A09484',
      '--accent':         '#A37764',
      '--accent-light':   '#C39E88',
      '--accent-subtle':  'oklch(0.58 0.08 40 / 0.08)',
      '--accent-border':  'oklch(0.58 0.08 40 / 0.22)',
    },
    dark: {
      '--page-bg':        '#2d2521',
      '--surface':        '#342c27',
      '--surface-alt':    '#3a322c',
      '--surface-hover':  '#443b34',
      '--surface-0':      '#342c27',
      '--surface-1':      '#382f2a',
      '--surface-2':      '#3e352f',
      '--surface-3':      '#4a3f38',
      '--surface-active': '#574a42',
      '--border':         '#544840',
      '--border-light':   '#3e352f',
      '--text-primary':   '#F1F0E5',
      '--text-secondary': '#D4CCBE',
      '--text-muted':     '#A09484',
      '--accent':         '#C39E88',
      '--accent-light':   '#D8B8A4',
      '--accent-subtle':  'oklch(0.68 0.07 42 / 0.1)',
      '--accent-border':  'oklch(0.68 0.07 42 / 0.22)',
    },
  },
  {
    id: 'tangerine',
    label: 'Tangerine',
    desc: 'Energisk och djärv',
    swatches: ['#e05d38', '#f07050', '#f3a080', '#d6e4f0', '#e8ebed'],
    light: {
      '--page-bg':        '#e8ebed',
      '--surface':        '#ffffff',
      '--surface-alt':    '#e0e4e8',
      '--surface-hover':  '#d8dce2',
      '--surface-0':      '#ffffff',
      '--surface-1':      '#f0f2f4',
      '--surface-2':      '#e4e8ec',
      '--surface-3':      '#d6e4f0',
      '--surface-active': '#c8d8e8',
      '--border':         '#c4ccd4',
      '--border-light':   '#dce0e6',
      '--text-primary':   '#1c2433',
      '--text-secondary': '#3a4858',
      '--text-muted':     '#6a7888',
      '--accent':         '#e05d38',
      '--accent-light':   '#f07050',
      '--accent-subtle':  'oklch(0.60 0.19 30 / 0.08)',
      '--accent-border':  'oklch(0.60 0.19 30 / 0.22)',
    },
    dark: {
      '--page-bg':        '#1c2433',
      '--surface':        '#222c3a',
      '--surface-alt':    '#283242',
      '--surface-hover':  '#303c4e',
      '--surface-0':      '#222c3a',
      '--surface-1':      '#252f3e',
      '--surface-2':      '#2a3444',
      '--surface-3':      '#2a3656',
      '--surface-active': '#344060',
      '--border':         '#354560',
      '--border-light':   '#2a3648',
      '--text-primary':   '#e8ecf0',
      '--text-secondary': '#b4c0cc',
      '--text-muted':     '#7a8ea0',
      '--accent':         '#e05d38',
      '--accent-light':   '#f07050',
      '--accent-subtle':  'oklch(0.60 0.19 30 / 0.1)',
      '--accent-border':  'oklch(0.60 0.19 30 / 0.22)',
    },
  },
  {
    id: 'bold-tech',
    label: 'Bold Tech',
    desc: 'Modern och kraftfull',
    swatches: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#dbeafe', '#f3f0ff'],
    light: {
      '--page-bg':        '#f5f5ff',
      '--surface':        '#ffffff',
      '--surface-alt':    '#eeeeff',
      '--surface-hover':  '#e6e4ff',
      '--surface-0':      '#ffffff',
      '--surface-1':      '#f8f7ff',
      '--surface-2':      '#f0eeff',
      '--surface-3':      '#e2ddf8',
      '--surface-active': '#d4cef2',
      '--border':         '#d0c8f0',
      '--border-light':   '#e8e4f8',
      '--text-primary':   '#312e81',
      '--text-secondary': '#4b47a0',
      '--text-muted':     '#7a76b0',
      '--accent':         '#8b5cf6',
      '--accent-light':   '#a78bfa',
      '--accent-subtle':  'oklch(0.55 0.22 290 / 0.08)',
      '--accent-border':  'oklch(0.55 0.22 290 / 0.22)',
    },
    dark: {
      '--page-bg':        '#0f172a',
      '--surface':        '#151d32',
      '--surface-alt':    '#1a2440',
      '--surface-hover':  '#232e50',
      '--surface-0':      '#151d32',
      '--surface-1':      '#18203a',
      '--surface-2':      '#1e2844',
      '--surface-3':      '#1e1b4b',
      '--surface-active': '#2a2668',
      '--border':         '#2a2660',
      '--border-light':   '#1e2548',
      '--text-primary':   '#e0e7ff',
      '--text-secondary': '#b4bce0',
      '--text-muted':     '#7a82b0',
      '--accent':         '#8b5cf6',
      '--accent-light':   '#a78bfa',
      '--accent-subtle':  'oklch(0.55 0.22 290 / 0.1)',
      '--accent-border':  'oklch(0.55 0.22 290 / 0.22)',
    },
  },
];

type ThemeId = string;

const FONT_OPTIONS = [
  {
    id: 'inter',
    label: 'Inter',
    desc: 'Sans-serif',
    css: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
    sampleStyle: { fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' },
  },
  {
    id: 'system',
    label: 'System',
    desc: 'Standard',
    css: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    sampleStyle: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' },
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    desc: 'Geometrisk',
    css: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    sampleStyle: { fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif' },
  },
  {
    id: 'geist',
    label: 'Geist',
    desc: 'Modern',
    css: '"Geist", ui-sans-serif, system-ui, sans-serif',
    sampleStyle: { fontFamily: '"Geist", ui-sans-serif, system-ui, sans-serif' },
  },
  {
    id: 'lora',
    label: 'Lora',
    desc: 'Serif',
    css: '"Lora", Georgia, serif',
    sampleStyle: { fontFamily: '"Lora", Georgia, serif' },
  },
  {
    id: 'cormorant',
    label: 'Cormorant',
    desc: 'Elegant serif',
    css: 'var(--font-cormorant), Georgia, serif',
    sampleStyle: { fontFamily: 'var(--font-cormorant), Georgia, serif' },
  },
  {
    id: 'jetbrains',
    label: 'JetBrains Mono',
    desc: 'Monospace',
    css: '"JetBrains Mono", ui-monospace, monospace',
    sampleStyle: { fontFamily: '"JetBrains Mono", ui-monospace, monospace' },
  },
  {
    id: 'source-serif',
    label: 'Source Serif',
    desc: 'Klassisk serif',
    css: '"Source Serif 4", Georgia, serif',
    sampleStyle: { fontFamily: '"Source Serif 4", Georgia, serif' },
  },
] as const;

type FontId = typeof FONT_OPTIONS[number]['id'];

// ─── E-post tab ──────────────────────────────────────────────────────────────

function EpostTab() {
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName]   = useState('');
  const [pending, setPending]         = useState(false);
  const [saved, setSaved]             = useState(false);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    fetch('/api/org/email-settings')
      .then((r) => r.json())
      .then((res) => {
        const d = res.data ?? res;
        setSenderEmail(d.senderEmail ?? '');
        setSenderName(d.senderName ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setPending(true);
    setSaved(false);
    try {
      await fetch('/api/org/email-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: senderEmail.trim() || null,
          senderName: senderName.trim() || null,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // silent
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard
        title="Avsändaradress"
        description="Ange den e-postadress som utgående offerter och notifieringar skickas ifrån. Adressen måste vara verifierad hos din e-postleverantör (Resend)."
      >
        <div className="space-y-4">
          <div>
            <FieldLabel description="Visningsnamnet som mottagaren ser, t.ex. &quot;Acme AB&quot;">
              Avsändarnamn
            </FieldLabel>
            <Input
              value={senderName}
              onChange={setSenderName}
              placeholder="Mitt Företag AB"
            />
          </div>
          <div>
            <FieldLabel description="E-postadressen som e-post skickas ifrån. Domänen måste vara verifierad i Resend.">
              Avsändaradress
            </FieldLabel>
            <Input
              value={senderEmail}
              onChange={setSenderEmail}
              placeholder="offert@mittforetag.se"
              type="email"
            />
          </div>
          <div className="pt-1">
            <SaveButton pending={pending} saved={saved} onClick={handleSave} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Så fungerar det">
        <div className="space-y-2 text-xs text-[var(--text-muted)] leading-relaxed">
          <p>
            När du anger en avsändaradress ovan kommer alla utgående offerter, påminnelser och notifieringar
            att skickas från den adressen istället för standardadressen.
          </p>
          <p>
            Mottagaren ser ditt valda namn och e-postadress i sin inkorg. Lämna fälten tomma
            för att använda systemets standardadress.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Utseende tab ─────────────────────────────────────────────────────────────

function UtseendeTab() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'auto';
    const storedTheme = localStorage.getItem('theme') as ThemeMode | null;
    return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'auto';
  });
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window === 'undefined') return 'medium';
    const storedFontSize = localStorage.getItem('fontSize') as FontSize | null;
    return storedFontSize === 'small' || storedFontSize === 'medium' || storedFontSize === 'large'
      ? storedFontSize
      : 'medium';
  });
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return 'claude';
    const storedAccent = localStorage.getItem('accentColor') as ThemeId | null;
    return THEMES.find((themeDef) => themeDef.id === storedAccent)?.id ?? 'claude';
  });
  const [fontFamily, setFontFamily] = useState<FontId>(() => {
    if (typeof window === 'undefined') return 'inter';
    const storedFont = localStorage.getItem('fontFamily') as FontId | null;
    return FONT_OPTIONS.find((option) => option.id === storedFont)?.id ?? 'inter';
  });
  const [pending, setPending] = useState(false);
  const [saved,   setSaved]   = useState(false);

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
      // Re-apply color theme for the new mode
      reapplyThemeForMode(isDark);
    } catch { /* ignore */ }
  }

  // All CSS custom properties that themes control — must clear before reapplying
  // so inline styles from a previous mode don't override the CSS cascade
  const THEME_PROPS = [
    '--page-bg', '--surface', '--surface-alt', '--surface-hover',
    '--surface-0', '--surface-1', '--surface-2', '--surface-3', '--surface-active',
    '--border', '--border-light', '--text-primary', '--text-secondary', '--text-muted',
    '--dot-color', '--grid-line-color', '--icon-muted',
    '--accent', '--accent-light', '--accent-subtle', '--accent-border',
  ];

  /** Clear all theme inline styles so CSS cascade takes over */
  function clearThemeInlineStyles() {
    const root = document.documentElement;
    for (const prop of THEME_PROPS) root.style.removeProperty(prop);
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

  /** Re-apply correct light/dark variant when mode changes */
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

  // Sync persisted appearance preferences into the live DOM without triggering state churn.
  useEffect(() => {
    try {
      const matchedTheme = THEMES.find((c) => c.id === selectedTheme);
      if (matchedTheme) {
        const isDark = document.documentElement.classList.contains('dark');
        const vars = isDark ? matchedTheme.dark : matchedTheme.light;
        for (const [prop, val] of Object.entries(vars)) {
          document.documentElement.style.setProperty(prop, val);
        }
      }

      const font = FONT_OPTIONS.find((o) => o.id === fontFamily);
      if (font) injectStyle(
        'font-family-override',
        font.id === 'inter' ? '' : `body { font-family: ${font.css} !important; }`,
      );

      const scales: Record<FontSize, number> = { small: 0.875, medium: 1, large: 1.125 };
      const s = scales[fontSize];
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
    } catch { /* ignore */ }
  }, [fontFamily, fontSize, selectedTheme]);

  function save() {
    setPending(true);
    setTimeout(() => {
      setPending(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2800);
    }, 500);
  }

  const modes: { id: ThemeMode; label: string; desc: string }[] = [
    { id: 'light', label: 'Ljust',  desc: 'Alltid ljust läge' },
    { id: 'dark',  label: 'Mörkt',  desc: 'Alltid mörkt läge' },
    { id: 'auto',  label: 'Auto',   desc: 'Följer systeminställning' },
  ];

  const fontSizes: { id: FontSize; label: string }[] = [
    { id: 'small',  label: 'Liten' },
    { id: 'medium', label: 'Normal' },
    { id: 'large',  label: 'Stor' },
  ];

  /* Tiny preview component for light / dark / auto cards */
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
    if (mode === 'dark')  return <div className="flex h-full w-full rounded-md overflow-hidden">{dark}</div>;
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
      {/* ── Section: Läge ── */}
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
                  selected
                    ? 'border-[var(--accent)]'
                    : 'border-[var(--border)] hover:border-[var(--text-muted)]/40',
                )}
              >
                {/* Preview thumbnail */}
                <div className="h-16 w-full">
                  <ModePreview mode={m.id} />
                </div>
                {/* Label area */}
                <div className="px-3 py-2.5">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{m.label}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{m.desc}</p>
                </div>
                {/* Checkmark badge */}
                <AnimatePresence>
                  {selected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={SPRING_SNAPPY}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center"
                    >
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

      {/* ── Section: Färgtema ── */}
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
                  selected
                    ? 'border-[var(--accent)]'
                    : 'border-[var(--border)] hover:border-[var(--text-muted)]/40',
                )}
              >
                {/* Color swatches */}
                <div className="flex gap-1 mb-2.5">
                  {t.swatches.map((s, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: s }}
                    />
                  ))}
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{t.label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.desc}</p>
                {/* Checkmark badge */}
                <AnimatePresence>
                  {selected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={SPRING_SNAPPY}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center"
                    >
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

      {/* ── Section: Typsnitt ── */}
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
                  'w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-100',
                  'focus:outline-none',
                  selected
                    ? 'bg-[var(--accent)]/5'
                    : 'hover:bg-[var(--surface-hover)]',
                )}
              >
                {/* Radio dot */}
                <span className={cn(
                  'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
                  selected
                    ? 'border-[var(--accent)]'
                    : 'border-[var(--border)]',
                )}>
                  {selected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.15 }}
                      className="w-2 h-2 rounded-full bg-[var(--accent)]"
                    />
                  )}
                </span>
                {/* Font sample + name */}
                <span
                  className="text-base font-medium text-[var(--text-primary)] w-8"
                  style={f.sampleStyle}
                >
                  Aa
                </span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{f.label}</span>
                <span className="text-xs text-[var(--text-muted)] ml-auto">{f.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--border-light)]" />

      {/* ── Section: Textstorlek ── */}
      <div className="py-6">
        <div className="mb-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Textstorlek</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Justera storleken på all text.</p>
        </div>
        <div className="mt-5 px-1">
          {/* Track */}
          <div className="relative h-6 flex items-center">
            <div className="absolute inset-x-0 h-[3px] rounded-full bg-[var(--border)]" />
            <div
              className="absolute left-0 h-[3px] rounded-full bg-[var(--accent)] transition-all duration-200"
              style={{ width: fontSize === 'small' ? '0%' : fontSize === 'medium' ? '50%' : '100%' }}
            />
            {fontSizes.map((fs, idx) => {
              const active = fontSize === fs.id;
              const left = idx === 0 ? '0%' : idx === 1 ? '50%' : '100%';
              return (
                <button
                  key={fs.id}
                  onClick={() => applyFontSize(fs.id)}
                  className="absolute -translate-x-1/2 focus:outline-none group"
                  style={{ left }}
                >
                  <div
                    className={cn(
                      'rounded-full transition-all duration-150 border-[3px] border-[var(--surface-0)]',
                      active
                        ? 'w-5 h-5 bg-[var(--accent)] shadow-sm'
                        : 'w-3.5 h-3.5 bg-[var(--border)] group-hover:bg-[var(--text-muted)]',
                    )}
                  />
                </button>
              );
            })}
          </div>
          {/* Labels under track */}
          <div className="flex justify-between mt-2">
            {fontSizes.map((fs) => (
              <span
                key={fs.id}
                className={cn(
                  'text-xs',
                  fontSize === fs.id ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-muted)]',
                  fs.id === 'medium' && 'text-center',
                  fs.id === 'large' && 'text-right',
                )}
              >
                {fs.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-light)]" />

      {/* ── Save row ── */}
      <div className="flex justify-end pt-5">
        <SaveButton pending={pending} saved={saved} onClick={save} />
      </div>
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
      description: 'Synka repositories, issues och pull requests direkt i Soleria.',
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
      <SectionCard title="Integrationer" description="Anslut Soleria till de verktyg du redan använder.">
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
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [pwPending,  setPwPending]  = useState(false);
  const [pwError,    setPwError]    = useState('');
  const [pwSaved,    setPwSaved]    = useState(false);

  async function changePassword() {
    setPwPending(true);
    setPwError('');
    setPwSaved(false);
    try {
      const res = await fetch('/api/auth/change-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setPwError(data.error ?? 'Något gick fel.');
        return;
      }
      setPwSaved(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setPwSaved(false), 3000);
    } catch {
      setPwError('Nätverksfel. Försök igen.');
    } finally {
      setPwPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Password */}
      <SectionCard title="Lösenord" description="Uppdatera ditt lösenord regelbundet för bättre säkerhet.">
        <div className="flex flex-col gap-4">
          <div>
            <FieldLabel>Nuvarande lösenord</FieldLabel>
            <Input value={currentPw} onChange={setCurrentPw} type="password" placeholder="Ditt nuvarande lösenord" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Nytt lösenord</FieldLabel>
              <Input value={newPw} onChange={setNewPw} placeholder="Minst 8 tecken" type="password" />
            </div>
            <div>
              <FieldLabel>Bekräfta nytt lösenord</FieldLabel>
              <Input value={confirmPw} onChange={setConfirmPw} placeholder="Upprepa lösenordet" type="password" />
            </div>
          </div>
          {pwError && <p className="text-sm text-red-500">{pwError}</p>}
          <SaveButton pending={pwPending} saved={pwSaved} onClick={() => void changePassword()} />
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
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="px-4 sm:px-8 py-6 max-w-4xl mx-auto w-full">
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

      {/* ── Tabs ── */}
      <Tabs defaultValue="profil">
        <div className="border-b border-[var(--border)] mb-5">
          <TabsList>
            {TABS.map((tab) => (
              <TabsTab key={tab.id} value={tab.id} icon={tab.icon}>
                {tab.label}
              </TabsTab>
            ))}
          </TabsList>
        </div>

        <TabsPanel value="profil"><ProfilTab user={user} /></TabsPanel>
        <TabsPanel value="epost"><EpostTab /></TabsPanel>
        <TabsPanel value="utseende"><UtseendeTab /></TabsPanel>
        <TabsPanel value="anslutningar"><AnslutningarTab /></TabsPanel>
        <TabsPanel value="sakerhet"><SakerhetTab user={user} /></TabsPanel>
      </Tabs>
    </div>
  );
}

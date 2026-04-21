'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { SPRING_STANDARD } from '@shared/lib/motion';

export type View = 'week' | 'month' | '2months';

export const VIEWS: { key: View; label: string }[] = [
  { key: 'week',    label: 'Vecka'  },
  { key: 'month',   label: 'Månad'  },
  { key: '2months', label: '2 mån'  },
];

// Fixed pixel dimensions — matching Google Calendar proportions
export const LABEL_W = 180;
export const ROW_H   = 52;
export const HEAD1_H = 32;
export const HEAD2_H = 42;

export const ROOM_LABEL: Record<string, string> = {
  Enkel:  'Enkelt rum',
  Dubbel: 'Dubbelrum',
  Svit:   'Svit',
};

export const TYPE_BADGE: Record<string, string> = {
  Enkel:  'bg-stone-100 dark:bg-stone-800   text-stone-600 dark:text-stone-300',
  Dubbel: 'bg-stone-200 dark:bg-stone-700   text-stone-700 dark:text-stone-200',
  Svit:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
};

export const BAR_COLOR: Record<string, { bg: string; text: string }> = {
  Enkel:  { bg: 'bg-stone-300 dark:bg-stone-600', text: 'text-stone-900 dark:text-stone-100' },
  Dubbel: { bg: 'bg-stone-400 dark:bg-stone-500', text: 'text-stone-950 dark:text-white'     },
  Svit:   { bg: 'bg-amber-400 dark:bg-amber-500', text: 'text-amber-950 dark:text-amber-50'  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export function toKey(d: Date) { return d.toISOString().split('T')[0]; }

export function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

export function diffDays(a: string, b: string): number {
  return Math.round(
    (new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000,
  );
}

export function fmtShort(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

export function todayMidnight(): Date { const d = new Date(); d.setHours(0,0,0,0); return d; }

export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const shift = (r.getDay() + 6) % 7;
  r.setDate(r.getDate() - shift);
  return r;
}

export function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }

export function daysInMonth(d: Date): number { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d); r.setMonth(r.getMonth() + n); return r;
}

// ── Real Google Calendar icon (accurate brand icon) ───────────────────────

export function GoogleCalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Google Kalender">
      {/* White base */}
      <rect width="64" height="64" rx="10" fill="#fff"/>
      {/* Red top bar */}
      <rect x="0" y="0" width="64" height="18" rx="10" fill="#EA4335"/>
      <rect x="0" y="10" width="64" height="8" fill="#EA4335"/>
      {/* Border */}
      <rect x="0.5" y="0.5" width="63" height="63" rx="9.5" stroke="#DADCE0" strokeWidth="1" fill="none"/>
      {/* Calendar lines */}
      <line x1="0" y1="18" x2="64" y2="18" stroke="#DADCE0" strokeWidth="1"/>
      <line x1="0" y1="34" x2="64" y2="34" stroke="#DADCE0" strokeWidth="0.75"/>
      <line x1="0" y1="50" x2="64" y2="50" stroke="#DADCE0" strokeWidth="0.75"/>
      <line x1="22" y1="18" x2="22" y2="64" stroke="#DADCE0" strokeWidth="0.75"/>
      <line x1="43" y1="18" x2="43" y2="64" stroke="#DADCE0" strokeWidth="0.75"/>
      {/* "31" number */}
      <text x="33" y="44" fontFamily="'Google Sans',Arial,sans-serif" fontSize="20" fontWeight="700" fill="#3C4043" textAnchor="middle">31</text>
      {/* Colored event dots */}
      <circle cx="11" cy="26" r="4" fill="#4285F4"/>
      <circle cx="32" cy="58" r="4" fill="#0F9D58"/>
      <circle cx="53" cy="26" r="4" fill="#F4B400"/>
    </svg>
  );
}

// ── CRM-style tab button ──────────────────────────────────────────────────

export function TabBtn({ active, onClick, icon, label, count }: {
  active: boolean; onClick: () => void; icon?: ReactNode; label: string; count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
        active
          ? 'bg-purple-700 dark:bg-amber-500 text-white shadow-sm'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] border border-transparent hover:border-[var(--border)]',
      ].join(' ')}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={[
          'rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums',
          active ? 'bg-white/25 text-white' : 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-muted)]',
        ].join(' ')}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Segmented control (for timeline view/week/month) ──────────────────────

export function SegmentedControl({
  options, value, onChange, size = 'md', layoutId = 'segmented-pill',
}: {
  options: { key: string; label: React.ReactNode }[];
  value: string;
  onChange: (v: string) => void;
  size?: 'sm' | 'md';
  layoutId?: string;
}) {
  const base = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm';
  return (
    <div className="relative flex bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={[
            base,
            'relative font-medium rounded-[10px] flex items-center gap-1.5 transition-colors duration-150',
            value === o.key
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
          ].join(' ')}
        >
          {value === o.key && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 bg-[var(--surface)] rounded-[10px] shadow-sm"
              transition={SPRING_STANDARD}
            />
          )}
          <span className="relative z-10">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center mb-5 float-animation">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
          <path d="M8 2v4M16 2v4"/><path d="M3 9h18"/><path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2"/>
        </svg>
      </div>
      <p className="text-[var(--text-secondary)] font-semibold text-sm">Inga aktiva bokningar</p>
      <p className="text-[var(--text-muted)] text-xs mt-1.5 max-w-[260px] leading-relaxed">
        Klicka på ett tillgängligt rum för att skapa en bokning, eller ring Soleria.
      </p>
    </div>
  );
}

// ── List view ──────────────────────────────────────────────────────────────

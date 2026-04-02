'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UserProps {
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl?: string | null;
  role: string;
  mfaEnabled?: boolean;
}

// ─── Icon ──────────────────────────────────────────────────────────────────────

export function Icon({ path, size = 16, className }: { path: React.ReactNode; size?: number; className?: string }) {
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

// ─── FieldLabel ────────────────────────────────────────────────────────────────

export function FieldLabel({ children, description }: { children: React.ReactNode; description?: string }) {
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

// ─── Input ─────────────────────────────────────────────────────────────────────

export function Input({
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

// ─── SectionCard ───────────────────────────────────────────────────────────────

export function SectionCard({ title, description, children }: {
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

// ─── SaveButton ────────────────────────────────────────────────────────────────

export function SaveButton({ pending, saved, onClick }: { pending: boolean; saved: boolean; onClick: () => void }) {
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

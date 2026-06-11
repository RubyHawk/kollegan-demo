'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export interface UserProps {
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl?: string | null;
  role: string;
  roles?: string[];
  mfaEnabled?: boolean;
  mfaAuthenticated?: boolean;
}

export function FieldLabel({ children, description }: { children: React.ReactNode; description?: string }) {
  return (
    <div className="mb-1.5">
      <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">
        {children}
      </label>
      {description && (
        <p className="text-[11px] text-[var(--ui-text-muted)] mt-0.5 leading-relaxed">{description}</p>
      )}
    </div>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  readOnly,
  type = 'text',
}: {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      placeholder={placeholder}
      readOnly={readOnly}
      className={cn(
        'w-full rounded-[var(--ui-radius-control)] border px-3 py-2 text-sm',
        'bg-[var(--ui-surface-raised)] text-[var(--ui-text)]',
        'placeholder:text-[var(--ui-text-muted)]',
        'outline-none transition-colors duration-150 focus:border-[var(--ui-accent)] focus:ring-2 focus:ring-[var(--ui-focus)]',
        readOnly
          ? 'cursor-default select-all border-[var(--ui-border-subtle)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-muted)]'
          : 'border-[var(--ui-border)] hover:border-[var(--ui-border-strong)]',
      )}
    />
  );
}

export function SectionCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Optional action band (e.g. a save button) pinned to the bottom of the card. */
  footer?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--ui-radius-panel)] border border-[var(--ui-border-subtle)] bg-[var(--ui-surface-raised)] shadow-[var(--ui-shadow-raised)]">
      <div className="px-6 pb-1 pt-5">
        <h3 className="text-sm font-semibold text-[var(--ui-text)]">{title}</h3>
        {description && (
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--ui-text-muted)]">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-3 border-t border-[var(--ui-border-subtle)] bg-[var(--ui-surface-subtle)] px-6 py-3.5">
          {footer}
        </div>
      )}
    </div>
  );
}

export function SaveButton({ pending, saved, onClick }: { pending: boolean; saved: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={cn(
        'rounded-[var(--ui-radius-md)] border px-5 py-2.5 text-sm font-semibold transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)]',
          pending
            ? 'cursor-wait border-[var(--ui-accent)]/40 bg-[var(--ui-accent)]/60 text-[var(--ui-text-inverse)]'
            : saved
              ? 'border-[var(--ui-success-text)] bg-[var(--ui-success-text)] text-[var(--ui-text-inverse)]'
              : 'border-[var(--ui-accent)] bg-[var(--ui-accent)] text-[var(--ui-text-inverse)] hover:border-[var(--ui-accent-hover)] hover:bg-[var(--ui-accent-hover)]',
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
                <Check aria-hidden="true" size={13} strokeWidth={2} />
                Sparat!
              </>
            ) : pending ? (
              'Sparar...'
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
            className="text-xs font-medium text-[var(--ui-success-text)]"
          >
            Ändringarna har sparats
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState, type ReactNode } from 'react';
import { CaretDown, PencilSimpleLine } from '@phosphor-icons/react';
import { cn } from '@shared/lib/utils';

export function InspectorDisclosure({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        'relative border-b border-[var(--border)] bg-[var(--surface)] last:border-b-0',
        open && 'before:absolute before:left-0 before:top-3 before:h-8 before:w-0.5 before:rounded-r before:bg-[var(--accent)]'
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[var(--surface-0)]"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">{title}</p>
            {badge ? (
              <span className="rounded-full bg-[var(--surface-active)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                {badge}
              </span>
            ) : null}
          </div>
          {subtitle ? <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">{subtitle}</p> : null}
        </div>
        <CaretDown
          size={16}
          weight="bold"
          className={cn('mt-0.5 shrink-0 text-[var(--text-muted)] transition-transform', open && 'rotate-180')}
        />
      </button>
      {open ? <div className="border-t border-[var(--border)] px-5 py-4">{children}</div> : null}
    </section>
  );
}

export function EditableSummaryCard({
  label,
  value,
  description,
  actionLabel,
  onClick,
}: {
  label: string;
  value: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</p>
          <p className="mt-1 break-words text-[13px] font-semibold text-[var(--text-primary)]">{value}</p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">{description}</p>
        </div>
        <button
          type="button"
          onClick={onClick}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)] transition-colors hover:bg-[var(--accent-subtle)]"
        >
          <PencilSimpleLine size={12} />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

export function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export function InspectorCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="relative border-b border-[var(--border)] bg-[var(--surface)] before:absolute before:left-0 before:top-3 before:h-8 before:w-0.5 before:rounded-r before:bg-[var(--accent)] last:border-b-0">
      <div className="px-5 py-3.5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">{title}</p>
        {subtitle && <p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">{subtitle}</p>}
      </div>
      <div className="border-t border-[var(--border)] px-5 py-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

export function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
        active
          ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)]'
          : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-border)] hover:text-[var(--text-primary)]'
      )}
    >
      {children}
    </button>
  );
}

export function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-[var(--text-primary)]">{title}</p>
          <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-secondary)]">{description}</p>
        </div>
        <ToggleSwitch checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}

export function StaticCard({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-[var(--text-primary)]">{title}</p>
          <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-secondary)]">{description}</p>
        </div>
        <span className="shrink-0 rounded bg-[var(--surface-active)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
          {badge}
        </span>
      </div>
    </div>
  );
}

export function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 text-[12px] leading-4 text-[var(--text-primary)]">{label}</span>
        <ToggleSwitch checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]',
        checked ? 'bg-[var(--accent)]' : 'bg-[var(--surface-active)]'
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          'pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

export const inputClass = 'w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-[12px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)]';
export const textareaClass = `${inputClass} min-h-[72px] resize-y`;
export const secondaryButtonClass = 'flex-1 rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--text-primary)]';

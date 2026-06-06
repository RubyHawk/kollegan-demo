'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, Pencil } from 'lucide-react';
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
        'relative border-b border-[var(--ui-border)] bg-[var(--ui-surface)] last:border-b-0',
        open && 'before:absolute before:left-0 before:top-3 before:h-8 before:w-0.5 before:rounded-r before:bg-[var(--ui-accent)]',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[12px] font-semibold uppercase text-[var(--ui-text)]">{title}</p>
            {badge ? (
              <span className="rounded-full bg-[var(--ui-surface-hover)] px-2 py-0.5 text-[9px] font-semibold uppercase text-[var(--ui-text-secondary)]">
                {badge}
              </span>
            ) : null}
          </div>
          {subtitle ? <p className="mt-1 text-[12px] leading-5 text-[var(--ui-text-secondary)]">{subtitle}</p> : null}
        </div>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className={cn('mt-0.5 shrink-0 text-[var(--ui-text-muted)] transition-transform', open && 'rotate-180')}
        />
      </button>
      {open ? <div className="border-t border-[var(--ui-border)] px-4 py-2.5">{children}</div> : null}
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
    <div className="py-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase text-[var(--ui-text-muted)]">{label}</p>
          <p className="mt-1 break-words text-[13px] font-semibold text-[var(--ui-text)]">{value}</p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--ui-text-secondary)]">{description}</p>
        </div>
        <button
          type="button"
          onClick={onClick}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase text-[var(--ui-accent)] transition-colors hover:bg-[var(--ui-surface-selected)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
        >
          <Pencil size={12} strokeWidth={1.75} />
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
    <section className="relative border-b border-[var(--ui-border)] bg-[var(--ui-surface)] before:absolute before:left-0 before:top-3 before:h-8 before:w-0.5 before:rounded-r before:bg-[var(--ui-accent)] last:border-b-0">
      <div className="px-4 py-2.5">
        <p className="text-[12px] font-semibold uppercase text-[var(--ui-text)]">{title}</p>
        {subtitle && <p className="mt-1 text-[12px] leading-5 text-[var(--ui-text-secondary)]">{subtitle}</p>}
      </div>
      <div className="border-t border-[var(--ui-border)] px-4 py-2.5">{children}</div>
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
      <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--ui-text-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

export function ModernSelect({
  value,
  onChange,
  options,
  title,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  title?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        title={title}
        className="h-8 w-full appearance-none rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2.5 pr-8 text-[12px] font-medium text-[var(--ui-text)] transition focus:border-[var(--ui-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={1.75}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]"
      />
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
        'min-h-7 rounded-md border border-transparent px-2.5 py-1 text-[11px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
        active
          ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface)] text-[var(--ui-accent)]'
          : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface)] hover:text-[var(--ui-text)]',
      )}
    >
      {children}
    </button>
  );
}

export function SegmentedControl({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={cn(
        'grid gap-0.5 rounded-lg bg-[var(--ui-surface-hover)] p-0.5',
        columns === 3 ? 'grid-cols-3' : 'grid-cols-2',
      )}
    >
      {children}
    </div>
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
    <div className="py-1">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-[var(--ui-text)]">{title}</p>
          <p className="mt-0.5 text-[11px] leading-4 text-[var(--ui-text-secondary)]">{description}</p>
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
    <div className="py-1">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-[var(--ui-text)]">{title}</p>
          <p className="mt-0.5 text-[11px] leading-4 text-[var(--ui-text-secondary)]">{description}</p>
        </div>
        <span className="shrink-0 rounded bg-[var(--ui-surface-hover)] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[var(--ui-text-secondary)]">
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
    <div className="py-1">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 text-[12px] leading-4 text-[var(--ui-text)]">{label}</span>
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
        'relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-surface)]',
        checked ? 'bg-[var(--ui-accent)]' : 'bg-[var(--ui-surface-hover)] ring-1 ring-inset ring-[var(--ui-border)]',
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          'pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-[var(--ui-surface-raised)] ring-1 ring-[var(--ui-border)] transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

export const inputClass = 'w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2.5 py-1.5 text-[12px] text-[var(--ui-text)] transition focus:border-[var(--ui-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)]';
export const textareaClass = `${inputClass} min-h-[72px] resize-y`;
export const secondaryButtonClass = 'flex-1 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--ui-text-secondary)] transition-colors hover:border-[var(--ui-accent-border)] hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]';

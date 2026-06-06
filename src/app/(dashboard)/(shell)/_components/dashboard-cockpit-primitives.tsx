'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { STAGGER_ITEM } from '@shared/lib/motion';
import { cn } from '@shared/lib/utils';

interface PanelProps {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, eyebrow, action, children, className }: PanelProps) {
  return (
    <motion.section
      {...STAGGER_ITEM}
      className={cn(
        'flex flex-col overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)]',
        className,
      )}
    >
      <div className="flex h-10 items-center justify-between gap-3 border-b border-[var(--ui-border)] px-3.5">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-normal text-[var(--ui-text)]">{title}</h2>
          {eyebrow ? (
            <p className="mt-px truncate text-[10.5px] leading-3 text-[var(--ui-text-secondary)]">{eyebrow}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </motion.section>
  );
}

export function EmptyPanelState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-1 items-center px-3.5 py-2.5">
      <div className="w-full rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-subtle)] px-3 py-2.5 text-left">
        <p className="text-xs font-semibold text-[var(--ui-text)]">{title}</p>
        <p className="mt-1 text-[11px] leading-4 text-[var(--ui-text-secondary)]">{body}</p>
      </div>
    </div>
  );
}

export function MetricTile({ label, value, detail, tone = 'neutral' }: {
  label: string;
  value: ReactNode;
  detail: string;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
}) {
  const toneClass = {
    neutral: 'bg-[var(--ui-surface)]',
    accent: 'bg-[var(--ui-surface-selected)]',
    success: 'bg-[var(--ui-success-bg)]',
    warning: 'bg-[var(--ui-warning-bg)]',
    danger: 'bg-[var(--ui-danger-bg)]',
  }[tone];

  return (
    <div className={cn('min-w-0 rounded px-2 py-1.5', toneClass)}>
      <p className="truncate whitespace-nowrap text-[9.5px] font-medium leading-3 text-[var(--ui-text-muted)]">{label}</p>
      <p className="mt-0.5 text-[14px] font-semibold tabular-nums leading-none text-[var(--ui-text)]">{value}</p>
      <p className="mt-0.5 truncate text-[9px] leading-3 text-[var(--ui-text-secondary)]">{detail}</p>
    </div>
  );
}

export function DashboardBadge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}) {
  const toneClass = {
    neutral: 'border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-secondary)]',
    accent: 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]',
    success: 'border-[var(--ui-success-border)] bg-[var(--ui-success-bg)] text-[var(--ui-success-text)]',
    warning: 'border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] text-[var(--ui-warning-text)]',
    danger: 'border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] text-[var(--ui-danger-text)]',
    info: 'border-[var(--ui-info-border)] bg-[var(--ui-info-bg)] text-[var(--ui-info-text)]',
  }[tone];

  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-full border px-2 text-[10.5px] font-medium leading-none whitespace-nowrap',
        toneClass,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DashboardDotLabel({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}) {
  const dotClass = {
    neutral: 'bg-[var(--ui-text-muted)]',
    accent: 'bg-[var(--ui-accent)]',
    success: 'bg-[var(--ui-success-text)]',
    warning: 'bg-[var(--ui-warning-text)]',
    danger: 'bg-[var(--ui-danger-text)]',
    info: 'bg-[var(--ui-info-text)]',
  }[tone];

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11.5px] font-medium leading-none text-[var(--ui-text-secondary)]', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
      <span className="truncate">{children}</span>
    </span>
  );
}

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
        'flex flex-col overflow-hidden rounded-lg border border-[var(--cockpit-border,var(--border))] bg-[var(--surface-0)] shadow-[var(--cockpit-shadow)]',
        className,
      )}
    >
      <div className="flex h-11 items-center justify-between gap-3 border-b border-[var(--cockpit-border-soft,var(--border))] px-4">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold tracking-normal text-[var(--text-primary)]">{title}</h2>
          {eyebrow ? (
            <p className="mt-0.5 truncate text-[11px] text-[var(--text-secondary)]">{eyebrow}</p>
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
    <div className="flex flex-1 items-center px-4 py-3">
      <div className="w-full rounded-md bg-[var(--surface-1)] px-3 py-3 text-left">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{body}</p>
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
    neutral: 'bg-[var(--surface-1)]',
    accent: 'bg-[var(--accent-subtle)]',
    success: 'bg-[var(--status-accepted-bg)]',
    warning: 'bg-[var(--status-warning-bg)]',
    danger: 'bg-[var(--status-danger-bg)]',
  }[tone];

  return (
    <div className={cn('min-h-[45px] min-w-0 rounded-md px-3 py-1.5', toneClass)}>
      <p className="truncate whitespace-nowrap text-[10px] font-medium leading-3 text-[var(--text-muted)]">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold tabular-nums leading-none text-[var(--text-primary)]">{value}</p>
      <p className="mt-0.5 text-[9.5px] leading-3 text-[var(--text-secondary)]">{detail}</p>
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
    neutral: 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--cockpit-border-soft,var(--border))]',
    accent: 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)]',
    success: 'bg-[var(--status-accepted-bg)] text-[var(--status-accepted-text)] border-[color-mix(in_srgb,var(--status-accepted-text)_18%,var(--border))]',
    warning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[color-mix(in_srgb,var(--status-warning-text)_18%,var(--border))]',
    danger: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border-[color-mix(in_srgb,var(--status-danger-text)_18%,var(--border))]',
    info: 'bg-[var(--status-viewed-bg)] text-[var(--status-viewed-text)] border-[color-mix(in_srgb,var(--status-viewed-text)_18%,var(--border))]',
  }[tone];

  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center rounded-full border px-2 text-[11px] font-medium leading-none whitespace-nowrap',
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
    neutral: 'bg-[var(--text-muted)]',
    accent: 'bg-[var(--accent)]',
    success: 'bg-[var(--status-accepted-text)]',
    warning: 'bg-[var(--status-warning-text)]',
    danger: 'bg-[var(--status-danger-text)]',
    info: 'bg-[var(--status-viewed-text)]',
  }[tone];

  return (
    <span className={cn('inline-flex items-center gap-2 text-[12px] font-medium leading-none text-[var(--text-secondary)]', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
      <span className="truncate">{children}</span>
    </span>
  );
}

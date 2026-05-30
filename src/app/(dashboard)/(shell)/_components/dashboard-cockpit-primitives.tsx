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
        'flex flex-col overflow-hidden rounded-md border border-[var(--cockpit-border,var(--border))] bg-[var(--surface-0)] shadow-[var(--cockpit-shadow)]',
        className,
      )}
    >
      <div className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--cockpit-border-soft,var(--border))] px-4 py-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-tight text-[var(--text-primary)]">{title}</h2>
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
    <div className="flex flex-1 items-center justify-center px-4 py-6 text-center">
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--text-secondary)]">{body}</p>
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
    neutral: 'border-[var(--border)] bg-[var(--surface-1)]',
    accent: 'border-[var(--accent-border)] bg-[var(--accent-subtle)]',
    success: 'border-[color-mix(in_srgb,var(--status-accepted-text)_24%,var(--border))] bg-[var(--status-accepted-bg)]',
    warning: 'border-[color-mix(in_srgb,var(--status-warning-text)_24%,var(--border))] bg-[var(--status-warning-bg)]',
    danger: 'border-[color-mix(in_srgb,var(--status-danger-text)_24%,var(--border))] bg-[var(--status-danger-bg)]',
  }[tone];

  return (
    <div className={cn('min-h-[52px] min-w-0 rounded-md border px-2.5 py-1.5', toneClass)}>
      <p className="text-[8.5px] font-semibold uppercase leading-3 text-[var(--text-muted)]">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold tabular-nums leading-none text-[var(--text-primary)]">{value}</p>
      <p className="mt-0.5 text-[9.5px] leading-3 text-[var(--text-secondary)]">{detail}</p>
    </div>
  );
}

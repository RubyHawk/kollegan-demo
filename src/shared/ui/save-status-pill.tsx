'use client';

import { CheckCircleIcon, CloudArrowUpIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { cn } from '@shared/lib/utils';

export type SaveStatus = 'idle' | 'dirty' | 'autosaving' | 'autosaved' | 'saving' | 'saved' | 'restored';

type SaveStatusPillProps = {
  status: SaveStatus;
  className?: string;
};

const LABELS: Record<SaveStatus, string> = {
  idle: 'Sparad',
  dirty: 'Osparade ändringar',
  autosaving: 'Sparar lokalt...',
  autosaved: 'Sparad lokalt',
  saving: 'Sparar...',
  saved: 'Sparad',
  restored: 'Utkast återställt',
};

export function SaveStatusPill({ status, className }: SaveStatusPillProps) {
  const tone = status === 'dirty' || status === 'restored'
    ? 'border-[color-mix(in_srgb,var(--status-warning-text)_22%,var(--border))] bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]'
    : status === 'saving' || status === 'autosaving'
      ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)]'
      : 'border-[color-mix(in_srgb,var(--status-success-text)_20%,var(--border))] bg-[var(--status-success-bg)] text-[var(--status-success-text)]';

  const icon = status === 'dirty' || status === 'restored'
    ? <WarningCircleIcon size={13} weight="fill" />
    : status === 'saving' || status === 'autosaving'
      ? <CloudArrowUpIcon size={13} className="animate-pulse" />
      : <CheckCircleIcon size={13} weight="fill" />;

  return (
    <span
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold',
        tone,
        className,
      )}
    >
      {icon}
      {LABELS[status]}
    </span>
  );
}

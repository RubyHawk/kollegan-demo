'use client';

import { CheckCircle, CircleAlert, CloudUpload } from 'lucide-react';
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
    ? 'border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] text-[var(--ui-warning-text)]'
    : status === 'saving' || status === 'autosaving'
      ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]'
      : 'border-[var(--ui-success-border)] bg-[var(--ui-success-bg)] text-[var(--ui-success-text)]';

  const icon = status === 'dirty' || status === 'restored'
    ? <CircleAlert size={13} strokeWidth={1.75} />
    : status === 'saving' || status === 'autosaving'
      ? <CloudUpload size={13} strokeWidth={1.75} className="animate-pulse" />
      : <CheckCircle size={13} strokeWidth={1.75} />;

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

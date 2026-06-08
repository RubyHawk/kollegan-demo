import type { ProjectStage } from '../_store/types';

export const STAGE_STYLE: Record<ProjectStage, string> = {
  details:     'bg-[var(--ui-info-bg)] text-[var(--ui-info-text)] border-[var(--ui-info-border)]',
  ordered:     'bg-[var(--ui-warning-bg)] text-[var(--ui-warning-text)] border-[var(--ui-warning-border)]',
  arrived:     'bg-[var(--ui-accent-subtle)] text-[var(--ui-accent)] border-[var(--ui-accent-border)]',
  in_progress: 'bg-[var(--ui-success-bg)] text-[var(--ui-success-text)] border-[var(--ui-success-border)]',
  completed:   'bg-[var(--ui-surface-subtle)] text-[var(--ui-text-muted)] border-[var(--ui-border)]',
};

export function fmtSEK(value: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(value);
}

export function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function fmtActor(actorId: string | null): string {
  if (!actorId || actorId === 'system') return 'Systemet';
  // actorId is a JWT subject (UUID) — display a generic label until a name lookup layer is added
  return 'Användare';
}

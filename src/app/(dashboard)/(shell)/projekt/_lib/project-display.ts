import type { ProjectStage } from '../_store/types';

export const STAGE_STYLE: Record<ProjectStage, string> = {
  details:     'bg-[var(--status-draft-bg)] text-[var(--status-draft-text)] border-[var(--status-draft-border)]',
  ordered:     'bg-[var(--status-sent-bg)] text-[var(--status-sent-text)] border-transparent',
  arrived:     'bg-[var(--status-viewed-bg)] text-[var(--status-viewed-text)] border-transparent',
  in_progress: 'bg-[var(--status-accepted-bg)] text-[var(--status-accepted-text)] border-transparent',
  completed:   'bg-[var(--surface-alt)] text-[var(--text-muted)] border-[var(--border)]',
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

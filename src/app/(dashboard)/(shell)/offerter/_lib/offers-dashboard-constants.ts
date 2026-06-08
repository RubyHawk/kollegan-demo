import type { StatusTone } from '@shared/ui/status-badge';
import type { OfferStatus, OfferProjectStage } from '../_store/types';

export const STATUS_TABS: { id: OfferStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Alla' },
  { id: 'draft', label: 'Utkast' },
  { id: 'sent', label: 'Skickade' },
  { id: 'viewed', label: 'Visade' },
  { id: 'accepted', label: 'Accepterade' },
  { id: 'declined', label: 'Avvisade' },
];

export const STATUS_STYLES: Record<OfferStatus, string> = {
  draft: 'border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-secondary)]',
  sent: 'border border-[var(--ui-info-border)] bg-[var(--ui-info-bg)] text-[var(--ui-info-text)]',
  viewed: 'border border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] text-[var(--ui-accent)]',
  accepted: 'border border-[var(--ui-success-border)] bg-[var(--ui-success-bg)] text-[var(--ui-success-text)]',
  declined: 'border border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] text-[var(--ui-danger-text)]',
  expired: 'border border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] text-[var(--ui-warning-text)]',
};

export const STATUS_TONE: Record<OfferStatus, StatusTone> = {
  draft: 'neutral',
  sent: 'info',
  viewed: 'accent',
  accepted: 'success',
  declined: 'danger',
  expired: 'warning',
};

export const STATUS_LABEL: Record<OfferStatus, string> = {
  draft: 'Utkast',
  sent: 'Skickad',
  viewed: 'Visad',
  accepted: 'Accepterad',
  declined: 'Avvisad',
  expired: 'Utgången',
};

export const PROJECT_STAGE_META: Record<OfferProjectStage, { label: string; bg: string; color: string }> = {
  details: { label: 'Uppgifter', bg: 'var(--ui-surface-subtle)', color: 'var(--ui-text-secondary)' },
  ordered: { label: 'Beställt', bg: 'var(--ui-info-bg)', color: 'var(--ui-info-text)' },
  arrived: { label: 'Ankommet', bg: 'var(--ui-accent-subtle)', color: 'var(--ui-accent)' },
  in_progress: { label: 'Pågår', bg: 'var(--ui-accent-subtle)', color: 'var(--ui-accent)' },
  completed: { label: 'Klart', bg: 'var(--ui-surface-subtle)', color: 'var(--ui-text-muted)' },
};

export const VALIDITY_OPTIONS = [
  { days: 7, label: '7 dagar' },
  { days: 14, label: '14 dagar' },
  { days: 30, label: '30 dagar' },
  { days: 60, label: '60 dagar' },
  { days: 90, label: '90 dagar' },
] as const;

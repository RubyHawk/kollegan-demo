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
  draft: 'bg-[var(--status-draft-bg)] text-[var(--status-draft-text)] border border-[var(--status-draft-border)]',
  sent: 'bg-[var(--status-sent-bg)] text-[var(--status-sent-text)]',
  viewed: 'bg-[var(--status-viewed-bg)] text-[var(--status-viewed-text)]',
  accepted: 'bg-[var(--status-accepted-bg)] text-[var(--status-accepted-text)]',
  declined: 'bg-[var(--status-declined-bg)] text-[var(--status-declined-text)]',
  expired: 'bg-[var(--status-expired-bg)] text-[var(--status-expired-text)]',
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
  details: { label: 'Uppgifter', bg: 'var(--surface-2)', color: 'var(--text-secondary)' },
  ordered: { label: 'Beställt', bg: 'var(--status-sent-bg)', color: 'var(--status-sent-text)' },
  arrived: { label: 'Ankommet', bg: 'var(--status-viewed-bg)', color: 'var(--status-viewed-text)' },
  in_progress: { label: 'Pågår', bg: 'var(--accent-subtle)', color: 'var(--accent)' },
  completed: { label: 'Klart', bg: 'var(--surface-alt)', color: 'var(--text-muted)' },
};

export const VALIDITY_OPTIONS = [
  { days: 7, label: '7 dagar' },
  { days: 14, label: '14 dagar' },
  { days: 30, label: '30 dagar' },
  { days: 60, label: '60 dagar' },
  { days: 90, label: '90 dagar' },
] as const;

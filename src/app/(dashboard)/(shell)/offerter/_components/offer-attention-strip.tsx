'use client';

import type { StatusTone } from '@shared/ui/status-badge';
import { cn } from '@shared/lib/utils';
import type { Offer, OfferStatus } from '../_store/types';
import { canRemind, fmtDate } from '../_lib/offers-dashboard-formatters';

type AttentionItem = {
  key: string;
  label: string;
  count: number;
  hint: string;
  tone: StatusTone;
  onClick: () => void;
};

type OfferAttentionStripProps = {
  offers: Offer[];
  tabCounts: Record<string, number>;
  onTabChange: (tab: OfferStatus | 'all') => void;
};

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: 'border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-secondary)]',
  success: 'border-[var(--ui-success-border)] bg-[var(--ui-success-bg)] text-[var(--ui-success-text)]',
  warning: 'border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)] text-[var(--ui-warning-text)]',
  danger: 'border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] text-[var(--ui-danger-text)]',
  info: 'border-[var(--ui-info-border)] bg-[var(--ui-info-bg)] text-[var(--ui-info-text)]',
  accent: 'border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] text-[var(--ui-accent)]',
};

function daysUntil(date: string) {
  const end = new Date(date).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000));
}

export function OfferAttentionStrip({
  offers,
  tabCounts,
  onTabChange,
}: OfferAttentionStripProps) {
  const viewedUnsigned = offers.filter((offer) => offer.status === 'viewed').length;
  const reminderReady = offers.filter(canRemind).length;
  const expiringSoon = offers.filter((offer) => {
    if (offer.status !== 'sent' && offer.status !== 'viewed') return false;
    if (!offer.validUntil) return false;
    const days = daysUntil(offer.validUntil);
    return days !== null && days >= 0 && days <= 7;
  });
  const oldestExpiring = expiringSoon
    .slice()
    .sort((left, right) => new Date(left.validUntil ?? '').getTime() - new Date(right.validUntil ?? '').getTime())[0];

  const items: AttentionItem[] = [
    {
      key: 'drafts',
      label: 'Utkast',
      count: tabCounts.draft ?? 0,
      hint: 'Offerter som inte har skickats ännu',
      tone: 'neutral',
      onClick: () => onTabChange('draft'),
    },
    {
      key: 'viewed',
      label: 'Visade utan svar',
      count: viewedUnsigned,
      hint: 'Kunder som har öppnat länken',
      tone: 'info',
      onClick: () => onTabChange('viewed'),
    },
    {
      key: 'reminders',
      label: 'Påminnelse redo',
      count: reminderReady,
      hint: 'Kan påminnas enligt cooldown',
      tone: 'warning',
      onClick: () => onTabChange('sent'),
    },
    {
      key: 'expiring',
      label: 'Går ut snart',
      count: expiringSoon.length,
      hint: oldestExpiring?.validUntil ? `Närmaste: ${fmtDate(oldestExpiring.validUntil)}` : 'Skickade offerter inom 7 dagar',
      tone: 'success',
      onClick: () => onTabChange('sent'),
    },
  ];

  if (items.every((item) => item.count === 0)) return null;

  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onClick}
          className={cn(
            'rounded-[var(--ui-radius-lg)] border p-3 text-left transition-colors hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2',
            TONE_CLASS[item.tone],
          )}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase opacity-75">{item.label}</span>
            <span className="tabular-nums text-lg font-bold">{item.count}</span>
          </span>
          <span className="mt-1 block truncate text-xs opacity-75">{item.hint}</span>
        </button>
      ))}
    </div>
  );
}

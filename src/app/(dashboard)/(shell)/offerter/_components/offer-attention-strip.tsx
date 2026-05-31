'use client';

import { cn } from '@shared/lib/utils';
import type { Offer, OfferStatus } from '../_store/types';
import { canRemind, fmtDate } from '../_lib/offers-dashboard-formatters';

type AttentionItem = {
  key: string;
  label: string;
  count: number;
  hint: string;
  tone: 'amber' | 'blue' | 'emerald' | 'slate';
  onClick: () => void;
};

type OfferAttentionStripProps = {
  offers: Offer[];
  tabCounts: Record<string, number>;
  onTabChange: (tab: OfferStatus | 'all') => void;
};

const TONE_CLASS: Record<AttentionItem['tone'], string> = {
  amber: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300',
  blue: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/40 dark:bg-blue-900/20 dark:text-blue-300',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-300',
  slate: 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-secondary)]',
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
      tone: 'slate',
      onClick: () => onTabChange('draft'),
    },
    {
      key: 'viewed',
      label: 'Visade utan svar',
      count: viewedUnsigned,
      hint: 'Kunder som har öppnat länken',
      tone: 'blue',
      onClick: () => onTabChange('viewed'),
    },
    {
      key: 'reminders',
      label: 'Påminnelse redo',
      count: reminderReady,
      hint: 'Kan påminnas enligt cooldown',
      tone: 'amber',
      onClick: () => onTabChange('sent'),
    },
    {
      key: 'expiring',
      label: 'Går ut snart',
      count: expiringSoon.length,
      hint: oldestExpiring?.validUntil ? `Närmaste: ${fmtDate(oldestExpiring.validUntil)}` : 'Skickade offerter inom 7 dagar',
      tone: 'emerald',
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
            'rounded-xl border px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25',
            TONE_CLASS[item.tone],
          )}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide opacity-75">{item.label}</span>
            <span className="text-lg font-bold tabular-nums">{item.count}</span>
          </span>
          <span className="mt-1 block truncate text-xs opacity-75">{item.hint}</span>
        </button>
      ))}
    </div>
  );
}

'use client';

import { useRef } from 'react';
import { cn } from '@shared/lib/utils';
import type { BulkResult, OfferStatus } from '../_store/types';
import { STATUS_TABS } from '../_lib/offers-dashboard-constants';
import {
  BlockingAlertCard,
  GenericErrorBanner,
  type BlockingAlert,
} from './offer-blocking-alerts';

type OffersPageHeaderProps = {
  onCreateOffer: () => void;
};

export function OffersPageHeader({ onCreateOffer }: OffersPageHeaderProps) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">Offerter</h1>
        <p className="text-sm text-[var(--text-muted)]">Skapa, skicka och följ upp offerter direkt från plattformen.</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onCreateOffer}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ny offert
        </button>
      </div>
    </div>
  );
}

type OffersNoticeStackProps = {
  blockingAlert: BlockingAlert | null;
  error: string | null;
  onDismiss: () => void;
};

export function OffersNoticeStack({ blockingAlert, error, onDismiss }: OffersNoticeStackProps) {
  if (blockingAlert) {
    return (
      <div className="mb-6">
        <BlockingAlertCard alert={blockingAlert} onDismiss={onDismiss} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <GenericErrorBanner message={error} onDismiss={onDismiss} />
      </div>
    );
  }

  return null;
}

type DraftSavedToastProps = {
  visible: boolean;
  onOpenDrafts: () => void;
};

export function DraftSavedToast({ visible, onOpenDrafts }: DraftSavedToastProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] shadow-lg px-4 py-3 text-sm text-[var(--text-primary)] animate-in fade-in slide-in-from-bottom-2 duration-200">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      Offert sparad som utkast — hittas under fliken{' '}
      <button
        type="button"
        onClick={onOpenDrafts}
        className="font-semibold underline hover:no-underline text-[var(--accent)]"
      >
        Utkast
      </button>
    </div>
  );
}

type BulkSendResultBannerProps = {
  result: BulkResult | null;
  onDismiss: () => void;
};

export function BulkSendResultBanner({ result, onDismiss }: BulkSendResultBannerProps) {
  if (!result) return null;

  return (
    <div className="mb-6 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 flex items-center justify-between gap-3">
      <span>
        {result.sent} offert{result.sent !== 1 ? 'er' : ''} skickade
        {result.failed > 0 ? ` · ${result.failed} misslyckades` : ''}
      </span>
      <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

type BulkActionBarProps = {
  selectedCount: number;
  selectedDraftCount: number;
  bulkSending: boolean;
  onBulkSend: () => void;
  onClearSelection: () => void;
};

export function BulkActionBar({
  selectedCount,
  selectedDraftCount,
  bulkSending,
  onBulkSend,
  onClearSelection,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--surface)] px-4 py-3 shadow-md">
      <span className="text-sm font-medium text-[var(--text-primary)]">
        {selectedCount} vald{selectedCount !== 1 ? 'a' : ''}
        {selectedDraftCount > 0 && selectedDraftCount < selectedCount && ` · ${selectedDraftCount} utkast`}
      </span>
      <div className="flex-1"/>
      {selectedDraftCount > 0 && (
        <button
          onClick={onBulkSend}
          disabled={bulkSending}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {bulkSending ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Skickar…
            </>
          ) : (
            `Skicka ${selectedDraftCount} offert${selectedDraftCount !== 1 ? 'er' : ''}`
          )}
        </button>
      )}
      <button
        onClick={onClearSelection}
        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        Rensa urval
      </button>
    </div>
  );
}

type OffersDashboardToolbarProps = {
  tab: OfferStatus | 'all';
  tabCounts: Record<string, number>;
  searchInput: string;
  dateFrom: string;
  dateTo: string;
  onTabChange: (tab: OfferStatus | 'all') => void;
  onSearchInputChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
};

export function OffersDashboardToolbar({
  tab,
  tabCounts,
  searchInput,
  dateFrom,
  dateTo,
  onTabChange,
  onSearchInputChange,
  onSearchChange,
  onDateFromChange,
  onDateToChange,
}: OffersDashboardToolbarProps) {
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map((t) => {
          const count = tabCounts[t.id] ?? 0;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0',
                isActive
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:bg-[var(--surface-active)] border border-[var(--border)]',
              )}
            >
              {t.label}
              {count > 0 && (
                <span className={cn(
                  'text-xs tabular-nums px-1.5 py-0.5 rounded-full leading-none',
                  isActive ? 'bg-white/25 text-white' : 'bg-[var(--surface)] text-[var(--text-muted)]',
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={searchInput}
            onChange={(event) => {
              const value = event.target.value;
              onSearchInputChange(value);
              if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
              searchDebounceRef.current = setTimeout(() => onSearchChange(value), 300);
            }}
            placeholder="Sök offert..."
            className="pl-8 pr-4 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors w-44"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[var(--text-muted)] shrink-0">Från</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => onDateFromChange(event.target.value)}
            className="py-1.5 px-2 rounded border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          <span className="text-[11px] text-[var(--text-muted)] shrink-0">Till</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => onDateToChange(event.target.value)}
            className="py-1.5 px-2 rounded border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                onDateFromChange('');
                onDateToChange('');
              }}
              className="text-[11px] text-[var(--text-muted)] hover:text-red-500 transition-colors px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

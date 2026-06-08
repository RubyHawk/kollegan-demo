'use client';

import { useRef } from 'react';
import { Check, Copy, Plus, Search, Send, X } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';
import { StatusBadge } from '@shared/ui/status-badge';
import { Toolbar, ToolbarGroup, ToolbarSpacer } from '@shared/ui/toolbar';
import { STATUS_TABS } from '../_lib/offers-dashboard-constants';
import type { BulkResult, OfferStatus } from '../_store/types';
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
    <PageHeader
      className="mb-6"
      title="Offerter"
      description="Skapa, skicka och följ upp offerter direkt från plattformen."
      actions={(
        <Button type="button" onClick={onCreateOffer}>
          <Plus size={16} strokeWidth={1.75} aria-hidden />
          Ny offert
        </Button>
      )}
    />
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
    <Panel
      variant="raised"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 px-4 py-3 text-sm"
    >
      <Check size={16} strokeWidth={1.75} className="shrink-0 text-[var(--ui-success-text)]" aria-hidden />
      <span>Offert sparad som utkast - hittas under fliken</span>
      <Button type="button" variant="link" className="h-auto text-sm" onClick={onOpenDrafts}>
        Utkast
      </Button>
    </Panel>
  );
}

type BulkSendResultBannerProps = {
  result: BulkResult | null;
  onDismiss: () => void;
};

export function BulkSendResultBanner({ result, onDismiss }: BulkSendResultBannerProps) {
  if (!result) return null;

  return (
    <Panel variant={result.failed > 0 ? 'warning' : 'selected'} className="mb-6 flex items-center justify-between gap-3 text-sm">
      <span>
        {result.sent} offert{result.sent !== 1 ? 'er' : ''} skickade
        {result.failed > 0 ? ` · ${result.failed} misslyckades` : ''}
      </span>
      <Button type="button" variant="ghost" size="icon" onClick={onDismiss} aria-label="Stäng resultat">
        <X size={16} strokeWidth={1.75} aria-hidden />
      </Button>
    </Panel>
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
    <Panel variant="selected" className="mb-4 flex items-center gap-3">
      <span className="text-sm font-medium text-[var(--ui-text)]">
        {selectedCount} vald{selectedCount !== 1 ? 'a' : ''}
        {selectedDraftCount > 0 && selectedDraftCount < selectedCount && ` · ${selectedDraftCount} utkast`}
      </span>
      <div className="flex-1" />
      {selectedDraftCount > 0 ? (
        <Button type="button" onClick={onBulkSend} disabled={bulkSending} loading={bulkSending}>
          {!bulkSending ? <Send size={16} strokeWidth={1.75} aria-hidden /> : null}
          {bulkSending ? 'Skickar...' : `Skicka ${selectedDraftCount} offert${selectedDraftCount !== 1 ? 'er' : ''}`}
        </Button>
      ) : null}
      <Button type="button" variant="ghost" size="sm" onClick={onClearSelection}>
        Rensa urval
      </Button>
    </Panel>
  );
}

type OffersDashboardToolbarProps = {
  tab: OfferStatus | 'all';
  tabCounts: Record<string, number>;
  searchInput: string;
  dateFrom: string;
  dateTo: string;
  hasActiveFilters: boolean;
  viewLinkCopied: boolean;
  onTabChange: (tab: OfferStatus | 'all') => void;
  onSearchInputChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onResetFilters: () => void;
  onCopyViewLink: () => void;
};

export function OffersDashboardToolbar({
  tab,
  tabCounts,
  searchInput,
  dateFrom,
  dateTo,
  hasActiveFilters,
  viewLinkCopied,
  onTabChange,
  onSearchInputChange,
  onSearchChange,
  onDateFromChange,
  onDateToChange,
  onResetFilters,
  onCopyViewLink,
}: OffersDashboardToolbarProps) {
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetFilters = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    onResetFilters();
  };

  return (
    <div className="mb-4 space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map((t) => {
          const count = tabCounts[t.id] ?? 0;
          const isActive = tab === t.id;
          return (
            <Button
              key={t.id}
              type="button"
              variant={isActive ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onTabChange(t.id)}
              className="shrink-0"
            >
              {t.label}
              {count > 0 ? <StatusBadge tone={isActive ? 'accent' : 'neutral'}>{count}</StatusBadge> : null}
            </Button>
          );
        })}
      </div>

      <Toolbar>
        <div className="relative w-full sm:w-56">
          <Search size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" aria-hidden />
          <Input
            value={searchInput}
            onChange={(event) => {
              const value = event.target.value;
              onSearchInputChange(value);
              if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
              searchDebounceRef.current = setTimeout(() => onSearchChange(value), 300);
            }}
            placeholder="Sök offert..."
            className="pl-9"
          />
        </div>
        <ToolbarGroup>
          <span className="text-xs text-[var(--ui-text-muted)]">Från</span>
          <Input type="date" value={dateFrom} onChange={(event) => onDateFromChange(event.target.value)} className="w-auto" />
          <span className="text-xs text-[var(--ui-text-muted)]">Till</span>
          <Input type="date" value={dateTo} onChange={(event) => onDateToChange(event.target.value)} className="w-auto" />
          {dateFrom || dateTo ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                onDateFromChange('');
                onDateToChange('');
              }}
              aria-label="Rensa datum"
            >
              <X size={16} strokeWidth={1.75} aria-hidden />
            </Button>
          ) : null}
        </ToolbarGroup>
        <ToolbarSpacer />
        <ToolbarGroup className={cn(!hasActiveFilters && 'ml-auto')}>
          {hasActiveFilters ? (
            <Button type="button" variant="secondary" size="sm" onClick={resetFilters}>
              Rensa filter
            </Button>
          ) : null}
          <Button type="button" variant="secondary" size="sm" onClick={onCopyViewLink}>
            {viewLinkCopied ? <Check size={16} strokeWidth={1.75} aria-hidden /> : <Copy size={16} strokeWidth={1.75} aria-hidden />}
            {viewLinkCopied ? 'Kopierad' : 'Kopiera vy'}
          </Button>
        </ToolbarGroup>
      </Toolbar>
    </div>
  );
}

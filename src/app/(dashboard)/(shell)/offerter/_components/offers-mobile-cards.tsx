'use client';

import { cn } from '@shared/lib/utils';
import type { Offer, OfferPriceDisplayMode } from '../_store/types';
import { STATUS_LABEL, STATUS_STYLES } from '../_lib/offers-dashboard-constants';
import {
  canRemind,
  fmtDate,
  fmtOfferNumber,
  fmtSEK,
  pricingSummary,
} from '../_lib/offers-dashboard-formatters';
import { ProjectStageBadge } from './project-stage-badge';
import { OffersMobileEmptyState } from './offers-empty-state';

type OfferAction = 'send' | 'accept' | 'decline' | 'duplicate' | 'remind';

type OffersMobileCardsProps = {
  offers: Offer[];
  acting: string | null;
  copied: string | null;
  priceDisplayMode: OfferPriceDisplayMode;
  onAcceptAction: (id: string, action: OfferAction) => void | Promise<void>;
  onCopyLink: (offer: Offer) => void | Promise<void>;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void | Promise<void>;
  onEdit: (offer: Offer) => void;
  onSend: (offer: Offer) => void;
};

export function OffersMobileCards({
  offers,
  acting,
  copied,
  priceDisplayMode,
  onAcceptAction,
  onCopyLink,
  onDelete,
  onDuplicate,
  onEdit,
  onSend,
}: OffersMobileCardsProps) {
  return (
    <div className="sm:hidden space-y-3">
      {offers.length === 0 && <OffersMobileEmptyState />}
      {offers.map((offer) => {
        const summary = pricingSummary(offer.lineItems, priceDisplayMode);

        return (
          <div
            key={offer.id}
            className={cn(
              'relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4',
              offer.project?.stage === 'completed' && 'border-[color-mix(in_srgb,var(--status-accepted-text)_38%,var(--border))]',
              offer.status === 'expired' && 'bg-amber-50/40 dark:bg-amber-900/10',
            )}
          >
            {offer.project?.stage === 'completed' && (
              <span className="absolute inset-y-0 left-0 w-1 bg-[var(--status-accepted-text)]" aria-hidden="true" />
            )}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{offer.title}</p>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">{fmtOfferNumber(offer)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className={cn('text-[10px] px-2.5 py-1 rounded-full font-semibold', STATUS_STYLES[offer.status])}>
                  {STATUS_LABEL[offer.status]}
                </span>
                <ProjectStageBadge offer={offer} />
              </div>
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">{offer.recipientName}</p>
                <p className="text-xs text-[var(--text-muted)]">{offer.recipientCompany ?? offer.recipientEmail}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[var(--text-primary)]">{fmtSEK(summary.totalAmount)}</p>
                <p className="text-[11px] text-[var(--text-muted)]">{summary.displayModeLabel}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
              <p className="text-[11px] text-[var(--text-muted)]">
                Giltig t.o.m. {offer.validUntil ? fmtDate(offer.validUntil) : '—'}
              </p>
              <div className="flex items-center gap-2">
                {offer.status === 'draft' && (
                  <button type="button" onClick={() => onEdit(offer)} title="Redigera" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </button>
                )}
                {offer.status === 'draft' && (
                  <button type="button" onClick={() => onSend(offer)} disabled={acting === offer.id} title="Skicka" className="text-[var(--text-muted)] hover:text-blue-500 transition-colors disabled:opacity-40">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  </button>
                )}
                {(offer.status === 'sent' || offer.status === 'viewed') && canRemind(offer) && (
                  <button type="button" onClick={() => void onAcceptAction(offer.id, 'remind')} disabled={acting === offer.id} title="Skicka påminnelse" aria-label="Skicka påminnelse" className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-amber-500 transition-colors disabled:opacity-40">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                  </button>
                )}
                {(offer.status === 'sent' || offer.status === 'viewed') && (
                  <button
                    type="button"
                    onClick={() => void onAcceptAction(offer.id, 'accept')}
                    disabled={acting === offer.id}
                    title="Acceptera åt kund"
                    aria-label="Acceptera åt kund"
                    className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-emerald-600 transition-colors disabled:opacity-40"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4" />
                      <path d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z" />
                    </svg>
                  </button>
                )}
                {(offer.status === 'sent' || offer.status === 'viewed') && (
                  <button type="button" onClick={() => void onCopyLink(offer)} title="Kopiera länk" className="text-[var(--text-muted)] hover:text-violet-500 transition-colors">
                    {copied === offer.id
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    }
                  </button>
                )}
                <button type="button" onClick={() => void onDuplicate(offer.id)} disabled={acting === offer.id} title="Duplicera" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-40">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                </button>
                <button type="button" onClick={() => onDelete(offer.id)} title="Ta bort" className="text-[var(--text-muted)] hover:text-red-500 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /></svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

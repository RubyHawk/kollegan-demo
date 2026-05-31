'use client';

import { getOfferPdfUrl } from '@shared/lib/api/offers.api';
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
import { OffersPaginationFooter } from './offers-pagination-footer';
import { OffersTableEmptyState } from './offers-empty-state';
import { ProjectStageBadge } from './project-stage-badge';

type OfferAction = 'send' | 'accept' | 'decline' | 'duplicate' | 'remind';

type OffersDesktopTableProps = {
  acting: string | null;
  allDraftsSelected: boolean;
  copied: string | null;
  copiedText: string | null;
  currentPage: number;
  draftOffers: Offer[];
  fetchingDocId: string | null;
  offers: Offer[];
  pageSize: number;
  priceDisplayMode: OfferPriceDisplayMode;
  selected: Set<string>;
  serverTotal: number;
  sortAsc: boolean;
  total: number;
  totalPages: number;
  onAcceptAction: (id: string, action: OfferAction) => void | Promise<void>;
  onCopyLink: (offer: Offer) => void | Promise<void>;
  onCopyText: (key: string, value: string, label: string) => void | Promise<void>;
  onCreateOffer: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void | Promise<void>;
  onEdit: (offer: Offer) => void;
  onFetchPreview: (id: string) => void | Promise<void>;
  onPageChange: (page: number | ((prev: number) => number)) => void;
  onSend: (offer: Offer) => void;
  onSortToggle: () => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAllDrafts: () => void;
};

export function OffersDesktopTable({
  acting,
  allDraftsSelected,
  copied,
  copiedText,
  currentPage,
  draftOffers,
  fetchingDocId,
  offers,
  pageSize,
  priceDisplayMode,
  selected,
  serverTotal,
  sortAsc,
  total,
  totalPages,
  onAcceptAction,
  onCopyLink,
  onCopyText,
  onCreateOffer,
  onDelete,
  onDuplicate,
  onEdit,
  onFetchPreview,
  onPageChange,
  onSend,
  onSortToggle,
  onToggleSelect,
  onToggleSelectAllDrafts,
}: OffersDesktopTableProps) {
  return (
    <div className="hidden sm:block rounded border border-[var(--border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b-2 border-[var(--border)] bg-[var(--surface-alt)]">
              <th className="px-3 py-2.5 w-8">
                {draftOffers.length > 0 && (
                  <input
                    type="checkbox"
                    checked={allDraftsSelected}
                    onChange={onToggleSelectAllDrafts}
                    title="Välj alla utkast"
                    className="rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"
                  />
                )}
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Rubrik</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Mottagare</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Status</th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Belopp</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Giltigt t.o.m.</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                <button onClick={onSortToggle} className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors">
                  Skapad
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {sortAsc
                      ? <><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></>
                      : <><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></>
                    }
                  </svg>
                </button>
              </th>
              <th className="px-3 py-2.5 w-24" />
            </tr>
          </thead>
          <tbody>
            {offers.map((offer, i) => {
              const summary = pricingSummary(offer.lineItems, priceDisplayMode);

              return (
                <tr
                  key={offer.id}
                  className={cn(
                    'group border-l-4 border-l-transparent hover:bg-[var(--surface-alt)] transition-colors',
                    i > 0 && 'border-t border-[var(--border)]',
                    offer.project?.stage === 'completed' && 'border-l-[var(--status-accepted-text)] bg-[color-mix(in_srgb,var(--status-accepted-bg)_28%,var(--surface-0))]',
                    offer.status === 'expired' && 'bg-amber-50/40 dark:bg-amber-900/10',
                  )}
                >
                  <td className="px-3 py-3 w-8">
                    {offer.status === 'draft' && (
                      <input
                        type="checkbox"
                        checked={selected.has(offer.id)}
                        onChange={() => onToggleSelect(offer.id)}
                        className="rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"
                      />
                    )}
                  </td>
                  <td className="px-3 py-3 max-w-[220px]">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate leading-tight">{offer.title}</p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <p className="truncate font-mono text-[10px] leading-tight text-[var(--text-muted)]">{fmtOfferNumber(offer)}</p>
                      <button
                        type="button"
                        onClick={() => void onCopyText(`number:${offer.id}`, fmtOfferNumber(offer), 'Offertnummer')}
                        title="Kopiera offertnummer"
                        aria-label="Kopiera offertnummer"
                        className="rounded p-0.5 text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] group-hover:opacity-100 focus:opacity-100"
                      >
                        {copiedText === `number:${offer.id}` ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3 max-w-[180px]">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate leading-tight">{offer.recipientName}</p>
                    <div className="flex items-center gap-1">
                      <p className="truncate text-[10px] leading-tight text-[var(--text-muted)]">{offer.recipientCompany ?? offer.recipientEmail}</p>
                      <button
                        type="button"
                        onClick={() => void onCopyText(`email:${offer.id}`, offer.recipientEmail, 'E-postadress')}
                        title="Kopiera e-post"
                        aria-label="Kopiera e-post"
                        className="rounded p-0.5 text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] group-hover:opacity-100 focus:opacity-100"
                      >
                        {copiedText === `email:${offer.id}` ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1.5">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold w-fit', STATUS_STYLES[offer.status])}>
                        {STATUS_LABEL[offer.status]}
                      </span>
                      <ProjectStageBadge offer={offer} />
                      {offer.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => onSend(offer)}
                          disabled={acting === offer.id}
                          className="text-[10px] font-medium text-[var(--accent)] hover:underline transition-colors text-left disabled:opacity-40 flex items-center gap-0.5"
                        >
                          Skicka
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{fmtSEK(summary.totalAmount)}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{summary.displayModeLabel}</p>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {offer.status === 'expired' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        Utgången {offer.validUntil ? fmtDate(offer.validUntil) : '—'}
                      </span>
                    ) : (
                      <p className="text-xs leading-tight text-[var(--text-secondary)]">
                        {offer.validUntil ? fmtDate(offer.validUntil) : '—'}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <p className="text-xs text-[var(--text-secondary)] leading-tight">{fmtDate(offer.createdAt)}</p>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1 rounded-lg bg-[var(--surface-0)]/80 px-1 py-0.5 opacity-90 transition-opacity duration-100 md:opacity-100">
                      {(offer.status === 'sent' || offer.status === 'viewed' || offer.status === 'accepted') && (
                        <>
                          <button
                            type="button"
                            onClick={() => void onFetchPreview(offer.id)}
                            disabled={fetchingDocId === offer.id}
                            title="Förhandsgranska dokument"
                            aria-label="Förhandsgranska dokument"
                            className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
                          >
                            {fetchingDocId === offer.id ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                              </svg>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => window.open(getOfferPdfUrl(offer.id), '_blank')}
                            title="Öppna PDF"
                            aria-label="Öppna PDF"
                            className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                            </svg>
                          </button>
                        </>
                      )}
                      {(offer.status === 'sent' || offer.status === 'viewed') && (
                        <button
                          type="button"
                          onClick={() => void onCopyLink(offer)}
                          title="Kopiera signeringslänk"
                          aria-label="Kopiera signeringslänk"
                          className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)] transition-colors"
                        >
                          {copied === offer.id
                            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                          }
                        </button>
                      )}
                      {offer.status === 'draft' && (
                        <button type="button" onClick={() => onEdit(offer)} title="Redigera utkast" aria-label="Redigera utkast" className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {offer.status === 'draft' && (
                        <button type="button" onClick={() => onSend(offer)} disabled={acting === offer.id} title="Skicka offert" aria-label="Skicka offert" className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-blue-500 transition-colors disabled:opacity-40">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        </button>
                      )}
                      {(offer.status === 'sent' || offer.status === 'viewed') && canRemind(offer) && (
                        <button type="button" onClick={() => void onAcceptAction(offer.id, 'remind')} disabled={acting === offer.id} title="Skicka påminnelse" aria-label="Skicka påminnelse" className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-amber-500 transition-colors disabled:opacity-40">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
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
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 12l2 2 4-4" />
                            <path d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z" />
                          </svg>
                        </button>
                      )}
                      <button type="button" onClick={() => void onDuplicate(offer.id)} disabled={acting === offer.id} title="Duplicera" aria-label="Duplicera offert" className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-40">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => onDelete(offer.id)} title="Ta bort" aria-label="Ta bort offert" className="rounded-md p-1 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 transition-colors">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {offers.length === 0 && <OffersTableEmptyState onCreateOffer={onCreateOffer} />}
          </tbody>
        </table>
      </div>
      <OffersPaginationFooter
        currentPage={currentPage}
        pageSize={pageSize}
        serverTotal={serverTotal}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}

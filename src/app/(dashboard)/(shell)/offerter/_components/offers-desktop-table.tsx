'use client';

import {
  ArrowDown,
  ArrowUp,
  Bell,
  Check,
  Copy,
  Eye,
  FileText,
  Link as LinkIcon,
  LoaderCircle,
  Pencil,
  Send,
  ShieldCheck,
  Trash,
} from 'lucide-react';
import { getOfferPdfUrl } from '@shared/lib/api/offers.api';
import { cn } from '@shared/lib/utils';
import { Button, type ButtonProps } from '@shared/ui/button';
import { StatusBadge } from '@shared/ui/status-badge';
import type { Offer, OfferPriceDisplayMode } from '../_store/types';
import { STATUS_LABEL, STATUS_TONE } from '../_lib/offers-dashboard-constants';
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

function OfferActionIconButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('size-7 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]', className)}
      {...props}
    >
      {children}
    </Button>
  );
}

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
    <div className="hidden overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] sm:block">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="h-10 border-b border-[var(--ui-border)] bg-[var(--ui-surface-subtle)]">
              <th className="w-8 px-3 py-2.5">
                {draftOffers.length > 0 && (
                  <input
                    type="checkbox"
                    checked={allDraftsSelected}
                    onChange={onToggleSelectAllDrafts}
                    title="Välj alla utkast"
                    className="cursor-pointer rounded border-[var(--ui-border)] accent-[var(--ui-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
                  />
                )}
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">Rubrik</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">Mottagare</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">Status</th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">Belopp</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">Giltigt t.o.m.</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">
                <Button
                  type="button"
                  variant="ghost"
                  size="compact"
                  onClick={onSortToggle}
                  className="h-7 gap-1 px-1 text-[11px] uppercase text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
                >
                  Skapad
                  {sortAsc ? <ArrowDown size={14} strokeWidth={2} /> : <ArrowUp size={14} strokeWidth={2} />}
                </Button>
              </th>
              <th className="w-24 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {offers.map((offer, i) => {
              const summary = pricingSummary(offer.lineItems, priceDisplayMode);

              return (
                <tr
                  key={offer.id}
                  className={cn(
                    'group h-10 border-l-4 border-l-transparent transition-colors hover:bg-[var(--ui-surface-hover)]',
                    i > 0 && 'border-t border-[var(--ui-border)]',
                    offer.project?.stage === 'completed' &&
                      'border-l-[var(--ui-success-text)] bg-[color-mix(in_srgb,var(--ui-success-bg)_45%,var(--ui-surface))]',
                    offer.status === 'expired' &&
                      'bg-[color-mix(in_srgb,var(--ui-warning-bg)_55%,var(--ui-surface))]',
                  )}
                >
                  <td className="w-8 px-3 py-3">
                    {offer.status === 'draft' && (
                      <input
                        type="checkbox"
                        checked={selected.has(offer.id)}
                        onChange={() => onToggleSelect(offer.id)}
                        className="cursor-pointer rounded border-[var(--ui-border)] accent-[var(--ui-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
                      />
                    )}
                  </td>
                  <td className="max-w-[220px] px-3 py-3">
                    <p className="truncate text-xs font-semibold leading-tight text-[var(--ui-text)]">{offer.title}</p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <p className="truncate font-mono text-[10px] leading-tight text-[var(--ui-text-muted)]">{fmtOfferNumber(offer)}</p>
                      <OfferActionIconButton
                        type="button"
                        onClick={() => void onCopyText(`number:${offer.id}`, fmtOfferNumber(offer), 'Offertnummer')}
                        title="Kopiera offertnummer"
                        aria-label="Kopiera offertnummer"
                        className="size-5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        {copiedText === `number:${offer.id}` ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={2} />}
                      </OfferActionIconButton>
                    </div>
                  </td>
                  <td className="max-w-[180px] px-3 py-3">
                    <p className="truncate text-xs font-medium leading-tight text-[var(--ui-text)]">{offer.recipientName}</p>
                    <div className="flex items-center gap-1">
                      <p className="truncate text-[10px] leading-tight text-[var(--ui-text-muted)]">{offer.recipientCompany ?? offer.recipientEmail}</p>
                      <OfferActionIconButton
                        type="button"
                        onClick={() => void onCopyText(`email:${offer.id}`, offer.recipientEmail, 'E-postadress')}
                        title="Kopiera e-post"
                        aria-label="Kopiera e-post"
                        className="size-5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        {copiedText === `email:${offer.id}` ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={2} />}
                      </OfferActionIconButton>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1.5">
                      <StatusBadge tone={STATUS_TONE[offer.status]} className="w-fit text-[10px]">
                        {STATUS_LABEL[offer.status]}
                      </StatusBadge>
                      <ProjectStageBadge offer={offer} />
                      {offer.status === 'draft' && (
                        <Button
                          type="button"
                          variant="link"
                          size="compact"
                          onClick={() => onSend(offer)}
                          disabled={acting === offer.id}
                          className="h-auto justify-start gap-1 px-0 py-0 text-left text-[10px] font-medium"
                        >
                          Skicka
                          <Send size={12} strokeWidth={2} />
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                    <p className="text-xs font-semibold text-[var(--ui-text)]">{fmtSEK(summary.totalAmount)}</p>
                    <p className="text-[10px] text-[var(--ui-text-muted)]">{summary.displayModeLabel}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {offer.status === 'expired' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ui-warning-text)]">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ui-warning-text)]" />
                        Utgången {offer.validUntil ? fmtDate(offer.validUntil) : '-'}
                      </span>
                    ) : (
                      <p className="text-xs leading-tight text-[var(--ui-text-secondary)]">
                        {offer.validUntil ? fmtDate(offer.validUntil) : '-'}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <p className="text-xs leading-tight text-[var(--ui-text-secondary)]">{fmtDate(offer.createdAt)}</p>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1 rounded-[var(--ui-radius-md)] bg-[var(--ui-surface-raised)]/80 px-1 py-0.5">
                      {(offer.status === 'sent' || offer.status === 'viewed' || offer.status === 'accepted') && (
                        <>
                          <OfferActionIconButton
                            type="button"
                            onClick={() => void onFetchPreview(offer.id)}
                            disabled={fetchingDocId === offer.id}
                            title="Förhandsgranska dokument"
                            aria-label="Förhandsgranska dokument"
                          >
                            {fetchingDocId === offer.id ? (
                              <LoaderCircle size={16} strokeWidth={2} className="animate-spin" />
                            ) : (
                              <Eye size={16} strokeWidth={2} />
                            )}
                          </OfferActionIconButton>
                          <OfferActionIconButton
                            type="button"
                            onClick={() => window.open(getOfferPdfUrl(offer.id), '_blank')}
                            title="Öppna PDF"
                            aria-label="Öppna PDF"
                          >
                            <FileText size={16} strokeWidth={2} />
                          </OfferActionIconButton>
                        </>
                      )}
                      {(offer.status === 'sent' || offer.status === 'viewed') && (
                        <OfferActionIconButton
                          type="button"
                          onClick={() => void onCopyLink(offer)}
                          title="Kopiera signeringslänk"
                          aria-label="Kopiera signeringslänk"
                          className="hover:text-[var(--ui-accent)]"
                        >
                          {copied === offer.id ? <Check size={16} strokeWidth={2} /> : <LinkIcon size={16} strokeWidth={2} />}
                        </OfferActionIconButton>
                      )}
                      {offer.status === 'draft' && (
                        <OfferActionIconButton type="button" onClick={() => onEdit(offer)} title="Redigera utkast" aria-label="Redigera utkast">
                          <Pencil size={16} strokeWidth={2} />
                        </OfferActionIconButton>
                      )}
                      {offer.status === 'draft' && (
                        <OfferActionIconButton
                          type="button"
                          onClick={() => onSend(offer)}
                          disabled={acting === offer.id}
                          title="Skicka offert"
                          aria-label="Skicka offert"
                          className="hover:text-[var(--ui-accent)]"
                        >
                          <Send size={16} strokeWidth={2} />
                        </OfferActionIconButton>
                      )}
                      {(offer.status === 'sent' || offer.status === 'viewed') && canRemind(offer) && (
                        <OfferActionIconButton
                          type="button"
                          onClick={() => void onAcceptAction(offer.id, 'remind')}
                          disabled={acting === offer.id}
                          title="Skicka påminnelse"
                          aria-label="Skicka påminnelse"
                          className="hover:text-[var(--ui-warning-text)]"
                        >
                          <Bell size={16} strokeWidth={2} />
                        </OfferActionIconButton>
                      )}
                      {(offer.status === 'sent' || offer.status === 'viewed') && (
                        <OfferActionIconButton
                          type="button"
                          onClick={() => void onAcceptAction(offer.id, 'accept')}
                          disabled={acting === offer.id}
                          title="Acceptera åt kund"
                          aria-label="Acceptera åt kund"
                          className="hover:text-[var(--ui-success-text)]"
                        >
                          <ShieldCheck size={16} strokeWidth={2} />
                        </OfferActionIconButton>
                      )}
                      <OfferActionIconButton
                        type="button"
                        onClick={() => void onDuplicate(offer.id)}
                        disabled={acting === offer.id}
                        title="Duplicera"
                        aria-label="Duplicera offert"
                      >
                        <Copy size={16} strokeWidth={2} />
                      </OfferActionIconButton>
                      <OfferActionIconButton
                        type="button"
                        onClick={() => onDelete(offer.id)}
                        title="Ta bort"
                        aria-label="Ta bort offert"
                        className="hover:bg-[var(--ui-danger-bg)] hover:text-[var(--ui-danger-text)]"
                      >
                        <Trash size={16} strokeWidth={2} />
                      </OfferActionIconButton>
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

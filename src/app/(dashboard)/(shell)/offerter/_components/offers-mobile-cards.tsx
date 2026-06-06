'use client';

import { Bell, Check, Copy, Link as LinkIcon, Pencil, Send, ShieldCheck, Trash } from 'lucide-react';
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
import { ProjectStageBadge } from './project-stage-badge';
import { OffersMobileEmptyState } from './offers-empty-state';

type OfferAction = 'send' | 'accept' | 'decline' | 'duplicate' | 'remind';

type OffersMobileCardsProps = {
  offers: Offer[];
  acting: string | null;
  copied: string | null;
  copiedText: string | null;
  priceDisplayMode: OfferPriceDisplayMode;
  onAcceptAction: (id: string, action: OfferAction) => void | Promise<void>;
  onCopyLink: (offer: Offer) => void | Promise<void>;
  onCopyText: (key: string, value: string, label: string) => void | Promise<void>;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void | Promise<void>;
  onEdit: (offer: Offer) => void;
  onSend: (offer: Offer) => void;
};

function OfferActionIconButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('size-9 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]', className)}
      {...props}
    >
      {children}
    </Button>
  );
}

export function OffersMobileCards({
  offers,
  acting,
  copied,
  copiedText,
  priceDisplayMode,
  onAcceptAction,
  onCopyLink,
  onCopyText,
  onDelete,
  onDuplicate,
  onEdit,
  onSend,
}: OffersMobileCardsProps) {
  return (
    <div className="space-y-3 sm:hidden">
      {offers.length === 0 && <OffersMobileEmptyState />}
      {offers.map((offer) => {
        const summary = pricingSummary(offer.lineItems, priceDisplayMode);

        return (
          <article
            key={offer.id}
            className={cn(
              'relative overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4',
              offer.project?.stage === 'completed' && 'border-[color-mix(in_srgb,var(--ui-success-text)_38%,var(--ui-border))]',
              offer.status === 'expired' && 'bg-[color-mix(in_srgb,var(--ui-warning-bg)_55%,var(--ui-surface))]',
            )}
          >
            {offer.project?.stage === 'completed' && (
              <span className="absolute inset-y-0 left-0 w-1 bg-[var(--ui-success-text)]" aria-hidden="true" />
            )}
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--ui-text)]">{offer.title}</p>
                <div className="flex items-center gap-1">
                  <p className="font-mono text-[11px] text-[var(--ui-text-muted)]">{fmtOfferNumber(offer)}</p>
                  <OfferActionIconButton
                    type="button"
                    onClick={() => void onCopyText(`number:${offer.id}`, fmtOfferNumber(offer), 'Offertnummer')}
                    title="Kopiera offertnummer"
                    aria-label="Kopiera offertnummer"
                    className="size-7"
                  >
                    {copiedText === `number:${offer.id}` ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={2} />}
                  </OfferActionIconButton>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <StatusBadge tone={STATUS_TONE[offer.status]} className="text-[10px]">
                  {STATUS_LABEL[offer.status]}
                </StatusBadge>
                <ProjectStageBadge offer={offer} />
              </div>
            </div>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-[var(--ui-text-secondary)]">{offer.recipientName}</p>
                <div className="flex items-center gap-1">
                  <p className="truncate text-xs text-[var(--ui-text-muted)]">{offer.recipientCompany ?? offer.recipientEmail}</p>
                  <OfferActionIconButton
                    type="button"
                    onClick={() => void onCopyText(`email:${offer.id}`, offer.recipientEmail, 'E-postadress')}
                    title="Kopiera e-post"
                    aria-label="Kopiera e-post"
                    className="size-7"
                  >
                    {copiedText === `email:${offer.id}` ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={2} />}
                  </OfferActionIconButton>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-[var(--ui-text)]">{fmtSEK(summary.totalAmount)}</p>
                <p className="text-[11px] text-[var(--ui-text-muted)]">{summary.displayModeLabel}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--ui-border)] pt-3">
              <p className="text-[11px] text-[var(--ui-text-muted)]">
                Giltig t.o.m. {offer.validUntil ? fmtDate(offer.validUntil) : '-'}
              </p>
              <div className="flex items-center gap-1">
                {offer.status === 'draft' && (
                  <OfferActionIconButton type="button" onClick={() => onEdit(offer)} title="Redigera" aria-label="Redigera">
                    <Pencil size={16} strokeWidth={2} />
                  </OfferActionIconButton>
                )}
                {offer.status === 'draft' && (
                  <OfferActionIconButton
                    type="button"
                    onClick={() => onSend(offer)}
                    disabled={acting === offer.id}
                    title="Skicka"
                    aria-label="Skicka"
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
                {(offer.status === 'sent' || offer.status === 'viewed') && (
                  <OfferActionIconButton
                    type="button"
                    onClick={() => void onCopyLink(offer)}
                    title="Kopiera länk"
                    aria-label="Kopiera länk"
                    className="hover:text-[var(--ui-accent)]"
                  >
                    {copied === offer.id ? <Check size={16} strokeWidth={2} /> : <LinkIcon size={16} strokeWidth={2} />}
                  </OfferActionIconButton>
                )}
                <OfferActionIconButton
                  type="button"
                  onClick={() => void onDuplicate(offer.id)}
                  disabled={acting === offer.id}
                  title="Duplicera"
                  aria-label="Duplicera"
                >
                  <Copy size={16} strokeWidth={2} />
                </OfferActionIconButton>
                <OfferActionIconButton
                  type="button"
                  onClick={() => onDelete(offer.id)}
                  title="Ta bort"
                  aria-label="Ta bort"
                  className="hover:bg-[var(--ui-danger-bg)] hover:text-[var(--ui-danger-text)]"
                >
                  <Trash size={16} strokeWidth={2} />
                </OfferActionIconButton>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

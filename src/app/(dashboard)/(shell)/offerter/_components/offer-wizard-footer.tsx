'use client';

import { Send } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { SaveStatusPill, type SaveStatus } from '@shared/ui/save-status-pill';
import type { pricingSummary } from '../_lib/offers-dashboard-formatters';
import { fmtSEK } from '../_lib/offers-dashboard-formatters';

type PricingSummary = ReturnType<typeof pricingSummary>;

type OfferWizardFooterProps = {
  totals: PricingSummary;
  saving: boolean;
  editingOfferId: string | null;
  saveAndSendActive: boolean;
  draftStatus: SaveStatus;
  createOffer: () => Promise<void>;
  markSaveAndSend: () => void;
};

export function OfferWizardFooter({
  totals,
  saving,
  editingOfferId,
  saveAndSendActive,
  draftStatus,
  createOffer,
  markSaveAndSend,
}: OfferWizardFooterProps) {
  const status: SaveStatus = saving
    ? 'saving'
    : editingOfferId
      ? 'dirty'
      : draftStatus;

  return (
    <div className="shrink-0 border-t border-[var(--ui-border)] bg-[var(--ui-surface)]">
      <div className="space-y-1 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--ui-text-muted)]">{totals.subtotalLabel}</span>
          <span className="tabular-nums text-xs text-[var(--ui-text-secondary)]">{fmtSEK(totals.exVat)}</span>
        </div>
        {totals.discountAmount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--ui-text-muted)]">Rabatt</span>
            <span className="tabular-nums text-xs text-[var(--ui-text-muted)]">- {fmtSEK(totals.discountAmount)}</span>
          </div>
        )}
        {totals.hasVat && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--ui-text-muted)]">{totals.vatLabel}</span>
            <span className="tabular-nums text-xs text-[var(--ui-text-muted)]">{fmtSEK(totals.vatAmount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-[var(--ui-border)] pt-2">
          <span className="text-xs font-semibold text-[var(--ui-text)]">{totals.totalLabel}</span>
          <span className="tabular-nums text-sm font-semibold text-[var(--ui-accent)]">{fmtSEK(totals.totalAmount)}</span>
        </div>
        <div className="text-right text-[10px] font-medium uppercase text-[var(--ui-text-muted)]">
          {totals.displayModeLabel}
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-3 pt-1">
        <SaveStatusPill status={status} className="hidden sm:inline-flex" />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void createOffer()}
          disabled={saving}
          loading={saving && !saveAndSendActive}
          className="whitespace-nowrap"
        >
          {saving && !saveAndSendActive ? 'Sparar...' : editingOfferId ? 'Spara' : 'Utkast'}
        </Button>
        <Button
          type="button"
          className="flex-1"
          size="sm"
          onClick={() => {
            markSaveAndSend();
            void createOffer();
          }}
          disabled={saving}
          loading={saving && saveAndSendActive}
        >
          {!saving || !saveAndSendActive ? <Send size={16} strokeWidth={1.75} aria-hidden /> : null}
          {saving && saveAndSendActive ? 'Sparar...' : editingOfferId ? 'Uppdatera & skicka' : 'Spara & skicka'}
        </Button>
      </div>
    </div>
  );
}

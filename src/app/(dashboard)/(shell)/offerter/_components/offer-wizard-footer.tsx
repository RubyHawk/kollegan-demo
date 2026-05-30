'use client';

import type { pricingSummary } from '../_lib/offers-dashboard-formatters';
import { fmtSEK } from '../_lib/offers-dashboard-formatters';
import { SaveStatusPill, type SaveStatus } from '@shared/ui/save-status-pill';

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
    <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="px-4 py-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">{totals.subtotalLabel}</span>
          <span className="text-xs tabular-nums text-[var(--text-secondary)]">{fmtSEK(totals.exVat)}</span>
        </div>
        {totals.discountAmount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Rabatt</span>
            <span className="text-xs tabular-nums text-[var(--text-muted)]">− {fmtSEK(totals.discountAmount)}</span>
          </div>
        )}
        {totals.hasVat && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">{totals.vatLabel}</span>
            <span className="text-xs tabular-nums text-[var(--text-muted)]">{fmtSEK(totals.vatAmount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/60">
          <span className="text-xs font-semibold text-[var(--text-primary)]">{totals.totalLabel}</span>
          <span className="text-sm font-semibold tabular-nums text-[var(--accent)]">{fmtSEK(totals.totalAmount)}</span>
        </div>
        <div className="text-right text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
          {totals.displayModeLabel}
        </div>
      </div>
      <div className="px-4 pb-3 pt-1 flex items-center gap-2">
        <SaveStatusPill status={status} className="hidden sm:inline-flex" />
        <button onClick={() => void createOffer()} disabled={saving} className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-active)] disabled:opacity-50 transition-all whitespace-nowrap">
          {saving && !saveAndSendActive ? 'Sparar...' : (editingOfferId ? 'Spara' : 'Utkast')}
        </button>
        <button onClick={() => { markSaveAndSend(); void createOffer(); }} disabled={saving} className="flex-1 py-2 text-xs font-semibold text-white bg-[var(--accent)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5">
          {saving && saveAndSendActive ? (
            <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>Sparar...</>
          ) : (
            <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>{editingOfferId ? 'Uppdatera & skicka' : 'Spara & skicka'}</>
          )}
        </button>
      </div>
    </div>
  );
}

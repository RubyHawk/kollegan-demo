'use client';

import { Search } from 'lucide-react';
import {
  formatVatRate,
  getDisplayUnitPrice,
} from '@modules/supporting/offers/domain/pricing';
import { Button } from '@shared/ui/button';
import { fmtSEK } from '../_lib/offers-dashboard-formatters';
import type { OfferPriceDisplayMode, OfferProduct } from '../_store/types';

type OfferWizardProductPickerProps = {
  services: OfferProduct[];
  filteredServices: OfferProduct[];
  productSearch: string;
  enforcedPriceDisplayMode: OfferPriceDisplayMode;
  setProductSearch: (value: string) => void;
  setProductPickerRow: (row: number | null) => void;
  pickProduct: (product: OfferProduct) => void;
};

export function OfferWizardProductPicker({
  services,
  filteredServices,
  productSearch,
  enforcedPriceDisplayMode,
  setProductSearch,
  setProductPickerRow,
  pickProduct,
}: OfferWizardProductPickerProps) {
  return (
    <div className="relative z-50">
      <div className="absolute left-0 right-0 top-0 overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] shadow-[var(--ui-shadow-raised)]">
        <div className="flex items-center gap-2 border-b border-[var(--ui-border)] px-3 py-2.5">
          <Search size={16} strokeWidth={1.75} className="shrink-0 text-[var(--ui-text-muted)]" aria-hidden />
          <input
            autoFocus
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setProductPickerRow(null);
            }}
            placeholder="Sök namn, beskrivning eller enhet..."
            className="flex-1 bg-transparent text-xs text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:outline-none"
          />
          <kbd className="shrink-0 rounded border border-[var(--ui-border)] px-1 py-0.5 text-[10px] text-[var(--ui-text-muted)]">Esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-[var(--ui-border)]">
          {filteredServices.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs font-medium text-[var(--ui-text-secondary)]">Inga produkter hittades</p>
              <p className="mt-1 text-[10px] text-[var(--ui-text-muted)]">Prova att söka på namn, beskrivning eller enhet.</p>
            </div>
          ) : (
            filteredServices.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => pickProduct(product)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--ui-radius-md)] border border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] text-[11px] font-bold text-[var(--ui-accent)]">
                  {product.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-[var(--ui-text)]">{product.name}</span>
                  <span className="block text-[10px] text-[var(--ui-text-muted)]">
                    {fmtSEK(getDisplayUnitPrice(product, enforcedPriceDisplayMode))}{product.unit ? ` / ${product.unit}` : ''} · {formatVatRate(product.vatRate)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
        {services.length > 0 ? (
          <div className="flex items-center justify-between border-t border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2 text-[10px] text-[var(--ui-text-muted)]">
            <span>{filteredServices.length} av {services.length} produkter</span>
            {productSearch.trim() ? (
              <Button type="button" variant="ghost" size="compact" onClick={() => setProductSearch('')} className="h-7 text-[10px]">
                Rensa sökning
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

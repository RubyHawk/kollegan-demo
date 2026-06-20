'use client';

import { Info, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { InlineAlert } from '@shared/ui/inline-alert';
import { cn } from '@shared/lib/utils';
import type { RestaurantMenuItem } from '@shared/lib/api/restaurant.api';
import type { RestaurantFulfillmentType } from '@shared/lib/api/restaurant-orders.api';
import { type DraftItem, modifierSummary, money } from './kassa-helpers';

type CreateOrderAction = 'hold' | 'send' | 'print' | 'pay';

export type QuickExtra = {
  label: string;
  item: RestaurantMenuItem | null;
};

export function KassaReceiptPanel({
  orderNumber,
  draftItems,
  selectedDraftId,
  draftTotalCents,
  discountCents,
  taxCents,
  totalCents,
  error,
  success,
  fulfillmentType,
  quickExtras,
  canMarkPaid,
  busy,
  online,
  onClear,
  onOpenOrderInfo,
  onFulfillmentTypeChange,
  onSelectDraftItem,
  onChangeQuantity,
  onRemoveDraftItem,
  onAddQuickExtra,
  onSubmitOrderAction,
}: {
  orderNumber: number | null;
  draftItems: DraftItem[];
  selectedDraftId: string | null;
  draftTotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  error: string;
  success: string;
  fulfillmentType: RestaurantFulfillmentType;
  quickExtras: QuickExtra[];
  canMarkPaid: boolean;
  busy: string | null;
  online: boolean;
  onClear: () => void;
  onOpenOrderInfo: () => void;
  onFulfillmentTypeChange: (value: RestaurantFulfillmentType) => void;
  onSelectDraftItem: (draftId: string) => void;
  onChangeQuantity: (draftId: string, delta: number) => void;
  onRemoveDraftItem: (draftId: string) => void;
  onAddQuickExtra: (item: RestaurantMenuItem) => void;
  onSubmitOrderAction: (action: CreateOrderAction) => void;
}) {
  return (
    <aside className="fluffy-receipt grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-[var(--ui-surface)]">
      <header className="border-b border-[var(--ui-border)] p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--ui-text-muted)]">Order</p>
            <h2 className="text-lg font-semibold">{orderNumber ? `#${orderNumber}` : 'Ny order'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="compact" onClick={onOpenOrderInfo}>
              <Info data-icon="inline-start" />
              Info
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="compact"
              disabled={draftItems.length === 0}
              onClick={onClear}
            >
              Rensa
            </Button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {([
            ['counter', 'Disk'],
            ['takeaway', 'Takeaway'],
            ['dine_in', 'Bord'],
            ['booking_linked', 'Bokning'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onFulfillmentTypeChange(value)}
              className={cn(
                'h-10 rounded-[var(--ui-radius-md)] border text-xs font-semibold transition-colors',
                fulfillmentType === value
                  ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]'
                  : 'border-[var(--ui-border)] bg-[var(--ui-bg)] text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-hover)]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className="min-h-0 overflow-y-auto p-3">
        {error ? <InlineAlert tone="danger" className="mb-3">{error}</InlineAlert> : null}
        {success ? <InlineAlert tone="success" className="mb-3">{success}</InlineAlert> : null}

        <div className="fluffy-receipt__lines divide-y divide-[var(--ui-border)] rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)]">
          {draftItems.length === 0 ? (
            <p className="p-4 text-sm text-[var(--ui-text-muted)]">Välj produkter för att bygga ordern.</p>
          ) : draftItems.map((item) => (
            <article
              key={item.draftId}
              role="button"
              tabIndex={0}
              aria-pressed={selectedDraftId === item.draftId}
              onClick={() => onSelectDraftItem(item.draftId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectDraftItem(item.draftId);
                }
              }}
              className={cn(
                'grid cursor-pointer gap-2 p-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
                selectedDraftId === item.draftId ? 'bg-[var(--ui-surface-selected)]' : 'hover:bg-[var(--ui-surface-hover)]',
              )}
            >
              <div className="flex items-center gap-3">
                <div className="grid size-12 shrink-0 overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)]">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid place-items-center text-[10px] font-semibold text-[var(--ui-text-muted)]">Fluffy&apos;s</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="truncate text-xs text-[var(--ui-text-muted)]">
                    {[item.variantName, modifierSummary(item.selectedModifiers ?? [])].filter(Boolean).join(' · ') || `${money(item.unitPriceCents)} styck`}
                  </p>
                </div>
                <p className="w-20 text-right text-sm font-semibold tabular-nums">{money(item.quantity * item.unitPriceCents)}</p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-9 items-center overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)]">
                  <button type="button" className="grid size-9 place-items-center" onClick={(event) => { event.stopPropagation(); onChangeQuantity(item.draftId, -1); }} aria-label="Minska antal">
                    <Minus size={15} strokeWidth={1.75} />
                  </button>
                  <span className="w-9 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                  <button type="button" className="grid size-9 place-items-center" onClick={(event) => { event.stopPropagation(); onChangeQuantity(item.draftId, 1); }} aria-label="Öka antal">
                    <Plus size={15} strokeWidth={1.75} />
                  </button>
                </div>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-[var(--ui-radius-md)] text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-danger-text)]"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveDraftItem(item.draftId);
                  }}
                  aria-label={`Ta bort ${item.name}`}
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-3 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase text-[var(--ui-text-muted)]">Snabba tillägg</p>
          <div className="grid grid-cols-2 gap-2">
            {quickExtras.map((extra) => (
              <button
                key={extra.label}
                type="button"
                disabled={!extra.item}
                onClick={() => {
                  if (extra.item) onAddQuickExtra(extra.item);
                }}
                className="min-h-10 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-2 text-left text-xs font-semibold transition-colors hover:bg-[var(--ui-surface-hover)] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <span className="block truncate">{extra.label}</span>
                <span className="text-[11px] text-[var(--ui-text-muted)]">
                  {extra.item ? 'Lägg till' : 'Saknas i meny'}
                </span>
              </button>
            ))}
          </div>
        </section>
      </section>

      <footer className="border-t border-[var(--ui-border)] p-3">
        <div className="fluffy-receipt__totals mb-3 flex flex-col gap-1 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-bg)] p-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-[var(--ui-text-muted)]">Delsumma</span>
            <span className="font-medium tabular-nums">{money(draftTotalCents)}</span>
          </div>
          {discountCents > 0 ? (
            <div className="flex justify-between gap-3">
              <span className="text-[var(--ui-text-muted)]">Rabatt</span>
              <span className="font-medium tabular-nums">-{money(discountCents)}</span>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <span className="text-[var(--ui-text-muted)]">Moms 12%</span>
            <span className="font-medium tabular-nums">{money(taxCents)}</span>
          </div>
          <div className="flex justify-between gap-3 border-t border-[var(--ui-border)] pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{money(totalCents)}</span>
          </div>
        </div>

        {!online ? (
          <InlineAlert tone="warning" className="mb-3">
            Kassan är offline. Vänta på uppkoppling innan ordern skapas.
          </InlineAlert>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="mb-2 h-12 w-full text-base"
          disabled={draftItems.length === 0 || !online}
          loading={busy === 'create-order'}
          onClick={() => onSubmitOrderAction('send')}
        >
          Skicka till kök
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            disabled={draftItems.length === 0 || !online || !canMarkPaid}
            loading={busy === 'create-order'}
            onClick={() => onSubmitOrderAction('pay')}
          >
            Betala
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={draftItems.length === 0 || !online}
            loading={busy === 'create-order'}
            onClick={() => onSubmitOrderAction('hold')}
          >
            Parkera
          </Button>
        </div>
      </footer>
    </aside>
  );
}

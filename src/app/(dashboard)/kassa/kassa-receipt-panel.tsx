'use client';

import { CalendarDays, ChefHat, CreditCard, Info, Minus, Plus, ShoppingBag, Trash2, Utensils } from 'lucide-react';
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

const FULFILLMENT_OPTIONS = [
  { value: 'counter', label: 'Disk', icon: Utensils },
  { value: 'takeaway', label: 'Takeaway', icon: ShoppingBag },
  { value: 'dine_in', label: 'Bord', icon: Utensils },
  { value: 'booking_linked', label: 'Bokning', icon: CalendarDays },
] as const;

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
      <header className="border-b border-[var(--ui-border)] p-4">
        <div className="mb-4 grid grid-cols-4 gap-2">
          {FULFILLMENT_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onFulfillmentTypeChange(option.value)}
                className={cn(
                  'flex h-12 items-center justify-center gap-2 rounded-[var(--ui-radius-lg)] border px-2 text-sm font-semibold transition-colors',
                  fulfillmentType === option.value
                    ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent)] text-[var(--ui-text-inverse)]'
                    : 'border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-hover)]',
                )}
              >
                <Icon size={16} strokeWidth={1.75} />
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--ui-text-muted)]">Order</p>
            <h2 className="text-xl font-bold">{orderNumber ? `Order #${orderNumber}` : 'Ny order'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="compact" className="h-10 px-3" onClick={onOpenOrderInfo}>
              <Info data-icon="inline-start" />
              Info
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="compact"
              className="h-10 px-3"
              disabled={draftItems.length === 0}
              onClick={onClear}
            >
              Rensa
            </Button>
          </div>
        </div>
      </header>

      <section className="min-h-0 overflow-y-auto p-4">
        {error ? <InlineAlert tone="danger" className="mb-3">{error}</InlineAlert> : null}
        {success ? <InlineAlert tone="success" className="mb-3">{success}</InlineAlert> : null}

        <div className="fluffy-receipt__lines rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)]">
          {draftItems.length === 0 ? (
            <p className="p-5 text-sm text-[var(--ui-text-muted)]">Välj produkter för att bygga ordern.</p>
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
                'fluffy-receipt__line grid cursor-pointer gap-2 border-b border-[var(--ui-border)] p-3 outline-none transition-colors last:border-b-0 focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
                selectedDraftId === item.draftId ? 'bg-[var(--ui-surface-selected)]' : 'hover:bg-[var(--ui-surface-hover)]',
              )}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--fluffy-board)] text-[11px] font-bold text-[var(--ui-text-inverse)]">
                  {item.quantity}
                </span>
                <div className="grid size-16 shrink-0 overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)]">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid place-items-center text-[10px] font-semibold text-[var(--ui-text-muted)]">Fluffy&apos;s</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{item.name}</p>
                      <p className="mt-0.5 truncate text-xs text-[var(--ui-text-muted)]">
                        {[item.variantName, modifierSummary(item.selectedModifiers ?? [])].filter(Boolean).join(' + ') || `${money(item.unitPriceCents)} styck`}
                      </p>
                    </div>
                    <p className="shrink-0 text-right text-sm font-bold tabular-nums">{money(item.quantity * item.unitPriceCents)}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex h-8 items-center overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)]">
                      <button type="button" className="grid size-8 place-items-center" onClick={(event) => { event.stopPropagation(); onChangeQuantity(item.draftId, -1); }} aria-label="Minska antal">
                        <Minus size={14} strokeWidth={1.75} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                      <button type="button" className="grid size-8 place-items-center" onClick={(event) => { event.stopPropagation(); onChangeQuantity(item.draftId, 1); }} aria-label="Öka antal">
                        <Plus size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="grid size-8 place-items-center rounded-[var(--ui-radius-md)] text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-danger-text)]"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveDraftItem(item.draftId);
                      }}
                      aria-label={`Ta bort ${item.name}`}
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-4 flex flex-col gap-2">
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
                className="min-h-10 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-left text-xs font-semibold transition-colors hover:bg-[var(--ui-surface-hover)] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <span className="block truncate">+ {extra.label}</span>
                <span className="text-[11px] text-[var(--ui-text-muted)]">
                  {extra.item ? 'Lägg till' : 'Saknas i meny'}
                </span>
              </button>
            ))}
          </div>
        </section>
      </section>

      <footer className="border-t border-[var(--ui-border)] p-4">
        <div className="fluffy-receipt__totals mb-3 flex flex-col gap-1 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3 text-sm">
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
          <div className="flex items-baseline justify-between gap-3 border-t border-[var(--ui-border)] pt-2 text-base font-bold">
            <span>Total</span>
            <span className="fluffy-receipt__total text-2xl tabular-nums">{money(totalCents)}</span>
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
          className="fluffy-action-send mb-2 h-12 w-full text-base font-bold"
          disabled={draftItems.length === 0 || !online}
          loading={busy === 'create-order'}
          onClick={() => onSubmitOrderAction('send')}
        >
          <ChefHat data-icon="inline-start" />
          Skicka till kök
        </Button>
        <Button
          type="button"
          className="fluffy-action-pay mb-2 h-12 w-full text-base font-bold"
          disabled={draftItems.length === 0 || !online || !canMarkPaid}
          loading={busy === 'create-order'}
          onClick={() => onSubmitOrderAction('pay')}
        >
          <CreditCard data-icon="inline-start" />
          Betala
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full"
          disabled={draftItems.length === 0 || !online}
          loading={busy === 'create-order'}
          onClick={() => onSubmitOrderAction('hold')}
        >
          Parkera
        </Button>
      </footer>
    </aside>
  );
}

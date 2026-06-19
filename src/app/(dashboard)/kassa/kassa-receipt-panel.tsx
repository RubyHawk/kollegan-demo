'use client';

import { Button } from '@shared/ui/button';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import { cn } from '@shared/lib/utils';
import type { RestaurantFulfillmentType, RestaurantPaymentMethod } from '@shared/lib/api/restaurant-orders.api';
import { type DraftItem, modifierSummary, money } from './kassa-helpers';

type CreateOrderAction = 'hold' | 'send' | 'print';

const PAYMENT_METHODS: Array<{ value: RestaurantPaymentMethod; label: string }> = [
  { value: 'card', label: 'Kort' },
  { value: 'swish', label: 'Swish' },
  { value: 'cash', label: 'Kontant' },
  { value: 'other', label: 'Annat' },
];

export function KassaReceiptPanel({
  draftItems,
  draftTotalCents,
  discountCents,
  taxCents,
  totalCents,
  error,
  success,
  fulfillmentType,
  tableLabel,
  bookingReference,
  customName,
  customPrice,
  orderNote,
  discountInput,
  paymentMethod,
  paidNow,
  canMarkPaid,
  busy,
  online,
  onClear,
  onFulfillmentTypeChange,
  onTableLabelChange,
  onBookingReferenceChange,
  onChangeQuantity,
  onChangeItemNote,
  onCustomNameChange,
  onCustomPriceChange,
  onOrderNoteChange,
  onDiscountInputChange,
  onAddCustomItem,
  onPaidNowChange,
  onPaymentMethodChange,
  onSubmitOrder,
  onSubmitOrderAction,
}: {
  draftItems: DraftItem[];
  draftTotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  error: string;
  success: string;
  fulfillmentType: RestaurantFulfillmentType;
  tableLabel: string;
  bookingReference: string;
  customName: string;
  customPrice: string;
  orderNote: string;
  discountInput: string;
  paymentMethod: RestaurantPaymentMethod;
  paidNow: boolean;
  canMarkPaid: boolean;
  busy: string | null;
  online: boolean;
  onClear: () => void;
  onFulfillmentTypeChange: (value: RestaurantFulfillmentType) => void;
  onTableLabelChange: (value: string) => void;
  onBookingReferenceChange: (value: string) => void;
  onChangeQuantity: (draftId: string, delta: number) => void;
  onChangeItemNote: (draftId: string, note: string) => void;
  onCustomNameChange: (value: string) => void;
  onCustomPriceChange: (value: string) => void;
  onOrderNoteChange: (value: string) => void;
  onDiscountInputChange: (value: string) => void;
  onAddCustomItem: () => void;
  onPaidNowChange: (paid: boolean) => void;
  onPaymentMethodChange: (method: RestaurantPaymentMethod) => void;
  onSubmitOrder: () => void;
  onSubmitOrderAction: (action: CreateOrderAction) => void;
}) {
  return (
    <aside className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] bg-[var(--ui-surface)]">
      <section className="min-h-0 overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--ui-text-muted)]">Kvitto</p>
            <p className="text-2xl font-semibold tabular-nums">{money(totalCents)}</p>
          </div>
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

        {error ? <InlineAlert tone="danger" className="mb-3">{error}</InlineAlert> : null}
        {success ? <InlineAlert tone="success" className="mb-3">{success}</InlineAlert> : null}

        <div className="mb-3 grid grid-cols-2 gap-2">
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
                'h-11 rounded-[var(--ui-radius-md)] border text-sm font-semibold transition-colors',
                fulfillmentType === value
                  ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]'
                  : 'border-[var(--ui-border)] bg-[var(--ui-bg)] text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-hover)]',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {fulfillmentType === 'dine_in' ? (
          <Input
            value={tableLabel}
            onChange={(event) => onTableLabelChange(event.target.value)}
            placeholder="Bord eller plats"
            maxLength={60}
            className="mb-3 bg-[var(--ui-bg)]"
          />
        ) : null}
        {fulfillmentType === 'booking_linked' ? (
          <Input
            value={bookingReference}
            onChange={(event) => onBookingReferenceChange(event.target.value)}
            placeholder="Bokningsnamn eller referens"
            maxLength={120}
            className="mb-3 bg-[var(--ui-bg)]"
          />
        ) : null}

        <div className="divide-y divide-[var(--ui-border)] rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)]">
          {draftItems.length === 0 ? (
            <p className="p-4 text-sm text-[var(--ui-text-muted)]">Inga rader.</p>
          ) : draftItems.map((item) => (
            <div key={item.draftId} className="grid gap-2 p-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-[var(--ui-text-muted)]">
                    {[item.variantName, modifierSummary(item.selectedModifiers ?? [])].filter(Boolean).join(' · ') || `${money(item.unitPriceCents)} styck`}
                  </p>
                </div>
                <div className="flex h-10 items-center overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--ui-border)]">
                  <button type="button" className="h-10 w-10 text-lg" onClick={() => onChangeQuantity(item.draftId, -1)}>-</button>
                  <span className="w-10 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                  <button type="button" className="h-10 w-10 text-lg" onClick={() => onChangeQuantity(item.draftId, 1)}>+</button>
                </div>
                <p className="w-20 text-right text-sm font-semibold tabular-nums">{money(item.quantity * item.unitPriceCents)}</p>
              </div>
              <Input
                value={item.note ?? ''}
                onChange={(event) => onChangeItemNote(item.draftId, event.target.value)}
                placeholder="Radnotering"
                maxLength={500}
                className="h-9 bg-[var(--ui-bg)]"
              />
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-[1fr_92px_auto] gap-2">
          <Input
            value={customName}
            onChange={(event) => onCustomNameChange(event.target.value)}
            placeholder="Fri rad"
          />
          <Input
            value={customPrice}
            onChange={(event) => onCustomPriceChange(event.target.value)}
            placeholder="Pris"
            inputMode="decimal"
          />
          <Button type="button" variant="secondary" size="compact" onClick={onAddCustomItem}>
            Lägg till
          </Button>
        </div>

        <Textarea
          value={orderNote}
          onChange={(event) => onOrderNoteChange(event.target.value)}
          placeholder="Ordernotering"
          maxLength={1000}
          className="mt-3 min-h-20 resize-none bg-[var(--ui-bg)]"
        />
      </section>

      <section className="border-t border-[var(--ui-border)] p-4">
        <div className="mb-3 space-y-1 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-bg)] p-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-[var(--ui-text-muted)]">Delsumma</span>
            <span className="font-medium tabular-nums">{money(draftTotalCents)}</span>
          </div>
          <div className="grid grid-cols-[1fr_112px] items-center gap-2">
            <span className="text-[var(--ui-text-muted)]">Rabatt</span>
            <Input
              value={discountInput}
              onChange={(event) => onDiscountInputChange(event.target.value)}
              placeholder="0"
              inputMode="decimal"
              className="h-9 bg-[var(--ui-surface)] text-right"
            />
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[var(--ui-text-muted)]">Rabatt summa</span>
            <span className="font-medium tabular-nums">-{money(discountCents)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[var(--ui-text-muted)]">Moms 12% ingår</span>
            <span className="font-medium tabular-nums">{money(taxCents)}</span>
          </div>
          <div className="flex justify-between gap-3 border-t border-[var(--ui-border)] pt-2 text-base font-semibold">
            <span>Totalt</span>
            <span className="tabular-nums">{money(totalCents)}</span>
          </div>
        </div>

        <div className="mb-3 flex rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] p-1">
          <button
            type="button"
            disabled={!canMarkPaid}
            onClick={() => onPaidNowChange(true)}
            className={cn(
              'h-10 flex-1 rounded-[calc(var(--ui-radius-md)-2px)] text-sm font-semibold disabled:cursor-not-allowed disabled:text-[var(--ui-text-disabled)]',
              paidNow ? 'bg-[var(--ui-accent)] text-[var(--ui-text-inverse)]' : 'text-[var(--ui-text-secondary)]',
            )}
          >
            Betald
          </button>
          <button
            type="button"
            onClick={() => onPaidNowChange(false)}
            className={cn(
              'h-10 flex-1 rounded-[calc(var(--ui-radius-md)-2px)] text-sm font-semibold',
              !paidNow ? 'bg-[var(--ui-accent)] text-[var(--ui-text-inverse)]' : 'text-[var(--ui-text-secondary)]',
            )}
          >
            Obetald
          </button>
        </div>

        <div className="mb-3 grid grid-cols-4 gap-2">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.value}
              type="button"
              disabled={!canMarkPaid || !paidNow}
              onClick={() => onPaymentMethodChange(method.value)}
              className={cn(
                'h-10 rounded-[var(--ui-radius-md)] border text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50',
                paidNow && paymentMethod === method.value
                  ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] text-[var(--ui-accent)]'
                  : 'border-[var(--ui-border)] bg-[var(--ui-bg)] text-[var(--ui-text-secondary)]',
              )}
            >
              {method.label}
            </button>
          ))}
        </div>

        {!online ? (
          <InlineAlert tone="warning" className="mb-3">
            Kassan är offline. Vänta på uppkoppling innan ordern skapas.
          </InlineAlert>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="mb-2 h-14 w-full text-base"
          disabled={draftItems.length === 0 || !online}
          loading={busy === 'create-order'}
          onClick={onSubmitOrder}
        >
          Skicka till kök
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={draftItems.length === 0 || !online}
            loading={busy === 'create-order'}
            onClick={() => onSubmitOrderAction('hold')}
          >
            Parkera
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={draftItems.length === 0 || !online}
            loading={busy === 'create-order'}
            onClick={() => onSubmitOrderAction('print')}
          >
            KOT/Print
          </Button>
        </div>
      </section>
    </aside>
  );
}

'use client';

import { Printer, StickyNote, UserRound, X } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { StatusBadge } from '@shared/ui/status-badge';
import { Textarea } from '@shared/ui/textarea';
import { cn } from '@shared/lib/utils';
import type { RestaurantFulfillmentType, RestaurantPaymentMethod } from '@shared/lib/api/restaurant-orders.api';
import { money } from './kassa-helpers';

type CreateOrderAction = 'hold' | 'send' | 'print' | 'pay';

const PAYMENT_METHODS: Array<{ value: RestaurantPaymentMethod; label: string }> = [
  { value: 'card', label: 'Kort' },
  { value: 'swish', label: 'Swish' },
  { value: 'cash', label: 'Kontant' },
  { value: 'other', label: 'Annat' },
];

const NOTE_CHIPS = ['Utan lök', 'Extra sås', 'Ej paprika', 'Glutenfritt'];

export function KassaOrderInfoPanel({
  orderNumber,
  draftLineCount,
  fulfillmentType,
  customerName,
  tableLabel,
  bookingReference,
  orderNote,
  discountInput,
  discountCents,
  paymentMethod,
  canAdmin,
  canMarkPaid,
  busy,
  online,
  onClose,
  onCustomerNameChange,
  onTableLabelChange,
  onBookingReferenceChange,
  onOrderNoteChange,
  onDiscountInputChange,
  onPaymentMethodChange,
  onSubmitOrderAction,
}: {
  orderNumber: number | null;
  draftLineCount: number;
  fulfillmentType: RestaurantFulfillmentType;
  customerName: string;
  tableLabel: string;
  bookingReference: string;
  orderNote: string;
  discountInput: string;
  discountCents: number;
  paymentMethod: RestaurantPaymentMethod;
  canAdmin: boolean;
  canMarkPaid: boolean;
  busy: string | null;
  online: boolean;
  onClose: () => void;
  onCustomerNameChange: (value: string) => void;
  onTableLabelChange: (value: string) => void;
  onBookingReferenceChange: (value: string) => void;
  onOrderNoteChange: (value: string) => void;
  onDiscountInputChange: (value: string) => void;
  onPaymentMethodChange: (method: RestaurantPaymentMethod) => void;
  onSubmitOrderAction: (action: CreateOrderAction) => void;
}) {
  return (
    <aside className="fluffy-context-panel grid min-h-0 grid-rows-[auto_1fr_auto] border-r border-[var(--ui-border)] bg-[var(--ui-surface)]">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--ui-border)] px-3 py-2">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--ui-text-muted)]">Orderinfo</p>
          <h2 className="text-base font-semibold">{orderNumber ? `Order #${orderNumber}` : 'Ny order'}</h2>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Stäng orderinfo" onClick={onClose}>
          <X />
        </Button>
      </header>

      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-3">
        <section className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">Status</span>
            <StatusBadge tone="neutral">Utkast</StatusBadge>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-[var(--ui-text-muted)]">Rader</dt>
              <dd className="font-semibold tabular-nums">{draftLineCount}</dd>
            </div>
            <div>
              <dt className="text-[var(--ui-text-muted)]">Typ</dt>
              <dd className="font-semibold">{fulfillmentTypeLabel(fulfillmentType)}</dd>
            </div>
          </dl>
        </section>

        <section className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold" htmlFor="kassa-customer-name">
            <UserRound size={16} strokeWidth={1.75} />
            Gäst / referens
          </label>
          <Input
            id="kassa-customer-name"
            value={customerName}
            onChange={(event) => onCustomerNameChange(event.target.value)}
            placeholder="Namn eller referens"
            maxLength={120}
          />
          <Input
            value={tableLabel}
            onChange={(event) => onTableLabelChange(event.target.value)}
            placeholder="Bord / plats"
            maxLength={60}
          />
          <Input
            value={bookingReference}
            onChange={(event) => onBookingReferenceChange(event.target.value)}
            placeholder="Bokningsreferens"
            maxLength={120}
          />
        </section>

        <section className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold" htmlFor="kassa-order-note">
            <StickyNote size={16} strokeWidth={1.75} />
            Intern notis
          </label>
          <div className="flex flex-wrap gap-2">
            {NOTE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="h-8 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-2 text-xs font-semibold hover:bg-[var(--ui-surface-hover)]"
                onClick={() => onOrderNoteChange([orderNote, chip].filter(Boolean).join(', '))}
              >
                {chip}
              </button>
            ))}
          </div>
          <Textarea
            id="kassa-order-note"
            value={orderNote}
            onChange={(event) => onOrderNoteChange(event.target.value)}
            placeholder="Notis till kök eller kassa"
            maxLength={1000}
            className="min-h-24 resize-none"
          />
        </section>

        <section className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Betalning</p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                type="button"
                disabled={!canMarkPaid}
                onClick={() => onPaymentMethodChange(method.value)}
                className={cn(
                  'h-10 rounded-[var(--ui-radius-md)] border text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60',
                  paymentMethod === method.value
                    ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] text-[var(--ui-accent)]'
                    : 'border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-secondary)]',
                )}
              >
                {method.label}
              </button>
            ))}
          </div>
        </section>

        {canAdmin ? (
          <section className="flex flex-col gap-2">
            <label className="text-sm font-semibold" htmlFor="kassa-discount">Rabatt</label>
            <div className="grid grid-cols-[1fr_auto] items-center gap-2">
              <Input
                id="kassa-discount"
                value={discountInput}
                onChange={(event) => onDiscountInputChange(event.target.value)}
                placeholder="0"
                inputMode="decimal"
              />
              <span className="text-sm font-semibold tabular-nums text-[var(--ui-text-muted)]">-{money(discountCents)}</span>
            </div>
          </section>
        ) : null}
      </div>

      <footer className="border-t border-[var(--ui-border)] p-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={draftLineCount === 0 || !online}
          loading={busy === 'create-order'}
          onClick={() => onSubmitOrderAction('print')}
        >
          <Printer data-icon="inline-start" />
          KOT / kvitto
        </Button>
      </footer>
    </aside>
  );
}

function fulfillmentTypeLabel(type: RestaurantFulfillmentType) {
  if (type === 'takeaway') return 'Takeaway';
  if (type === 'dine_in') return 'Bord';
  if (type === 'booking_linked') return 'Bokning';
  if (type === 'delivery') return 'Leverans';
  return 'Disk';
}

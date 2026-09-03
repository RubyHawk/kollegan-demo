'use client';

import { useState } from 'react';
import { CalendarCheck, ChevronRight, Clock3, CreditCard, LockKeyhole, RotateCcw, Send } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
import { cn } from '@shared/lib/utils';
import type {
  RestaurantBusinessDay,
  RestaurantFulfillmentType,
  RestaurantOrder,
  RestaurantOrderStatus,
  RestaurantOrderSummary,
} from '@shared/lib/api/restaurant-orders.api';
import { timeLabel } from './kassa-helpers';

const FULFILLMENT_LABELS: Record<RestaurantFulfillmentType, string> = {
  takeaway: 'Takeaway',
  dine_in: 'Bord',
  counter: 'Disk',
  booking_linked: 'Bokning',
  delivery: 'Leverans',
};

const STATUS_LABELS: Record<RestaurantOrderStatus, string> = {
  new: 'NY',
  preparing: 'TILLAGAS',
  ready: 'KLAR',
  completed: 'UTLÄMNAD',
  cancelled: 'MAKULERAD',
};

const STATUS_TONES: Record<RestaurantOrderStatus, StatusTone> = {
  new: 'info',
  preparing: 'warning',
  ready: 'success',
  completed: 'neutral',
  cancelled: 'danger',
};

function orderNextAction(order: RestaurantOrder): { status: RestaurantOrderStatus; label: string } | null {
  if (order.status === 'new') return { status: 'preparing', label: 'Tillagas' };
  if (order.status === 'preparing') return { status: 'ready', label: 'Klar' };
  if (order.status === 'ready') return { status: 'completed', label: 'Utlämna' };
  return null;
}

export function KassaActiveOrdersStrip({
  businessDay,
  summary,
  activeOrders,
  isComposingOrder,
  busy,
  canMarkPaid,
  canAdmin,
  onMarkPaid,
  onSendHeld,
  onMoveOrder,
  onReopenOrder,
  onCloseDay,
}: {
  businessDay: RestaurantBusinessDay | null;
  summary: RestaurantOrderSummary | null;
  activeOrders: RestaurantOrder[];
  isComposingOrder: boolean;
  busy: string | null;
  canMarkPaid: boolean;
  canAdmin: boolean;
  onMarkPaid: (order: RestaurantOrder) => void;
  onSendHeld: (order: RestaurantOrder) => void;
  onMoveOrder: (order: RestaurantOrder, status: RestaurantOrderStatus) => void;
  onReopenOrder: (order: RestaurantOrder) => void;
  onCloseDay: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!businessDay) return null;

  const activeCount = summary?.activeOrderCount ?? activeOrders.length;
  const unpaidCount = summary?.unpaidOrderCount ?? activeOrders.filter((order) => order.paymentStatus === 'unpaid').length;
  const dayBlocked = activeCount > 0 || unpaidCount > 0;
  const blocker = activeCount > 0
    ? `${activeCount} aktiva ordrar`
    : unpaidCount > 0
      ? `${unpaidCount} obetalda`
      : 'Kan stängas';

  const showDetailedOrders = expanded && !isComposingOrder;

  if (!showDetailedOrders) {
    const visibleOrders = activeOrders.slice(0, 4);

    return (
      <section
        id="dagavslut"
        className="fluffy-active-orders-strip fluffy-active-orders-strip--compact shrink-0 border-t border-[var(--ui-border)] px-3 py-2"
        aria-label="Aktiva ordrar"
      >
        <div className="flex h-full min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="fluffy-active-orders-count flex h-11 shrink-0 items-center rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] px-3 text-xs font-bold uppercase"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {activeCount === 0 ? 'Inga aktiva' : `${activeCount} aktiva`}
            </button>
            {unpaidCount > 0 ? (
              <span className="fluffy-active-orders-count flex h-11 shrink-0 items-center rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] px-3 text-xs font-bold uppercase">
                {unpaidCount} obetalda
              </span>
            ) : null}
            <div className="hidden min-w-0 items-center gap-2 sm:flex">
              {visibleOrders.map((order) => {
                const canReopen = order.isHeld && (order.kotStatus ?? 'not_sent') === 'not_sent';
                return (
                  <button
                    key={order.id}
                    type="button"
                    disabled={!canReopen}
                    className="fluffy-active-order-chip flex h-11 min-w-0 items-center gap-2 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] px-3 text-sm font-bold tabular-nums disabled:cursor-not-allowed disabled:opacity-65"
                    onClick={() => onReopenOrder(order)}
                  >
                    #{order.orderNumber}
                    <span className="truncate text-xs font-semibold text-[var(--ui-text-muted)]">
                      {FULFILLMENT_LABELS[order.fulfillmentType]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2">
            {dayBlocked ? <LockKeyhole size={16} strokeWidth={1.75} /> : <CalendarCheck size={16} strokeWidth={1.75} />}
            <div className="hidden text-left sm:block">
              <p className="text-[11px] font-bold uppercase leading-3">Dagavslut</p>
              <p className="max-w-28 truncate text-xs text-[var(--ui-text-muted)]">{dayBlocked ? blocker : 'Redo'}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="dagavslut" className="fluffy-active-orders-strip fluffy-active-orders-strip--expanded shrink-0 border-t border-[var(--ui-border)] px-3 py-2">
      <div className="flex h-full gap-3 overflow-x-auto pb-1">
        <button
          type="button"
          className="fluffy-active-orders-count flex min-w-[112px] items-center justify-center rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] px-3 py-2 text-xs font-bold uppercase"
          aria-expanded={expanded}
          onClick={() => setExpanded(false)}
        >
          Dölj
        </button>
        {activeOrders.length === 0 ? (
          <div className="fluffy-active-order-empty flex min-w-[220px] items-center rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 text-sm text-[var(--ui-text-muted)]">
            Inga aktiva ordrar
          </div>
        ) : activeOrders.map((order) => {
          const next = orderNextAction(order);
          const nextDisabled = next?.status === 'completed' && order.paymentStatus !== 'paid';
          const canReopen = order.isHeld && (order.kotStatus ?? 'not_sent') === 'not_sent';
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          return (
            <article
              key={order.id}
              className="fluffy-active-order-ticket grid min-w-[220px] max-w-[250px] grid-rows-[1fr_auto] gap-2 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2"
            >
              <button
                type="button"
                className={cn(
                  'min-w-0 rounded-[var(--ui-radius-sm)] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
                  !canReopen && 'cursor-default',
                )}
                disabled={!canReopen}
                onClick={() => onReopenOrder(order)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="fluffy-active-order-number text-lg font-extrabold leading-5 tabular-nums">#{order.orderNumber}</p>
                    <p className="mt-1 text-xs font-semibold">{FULFILLMENT_LABELS[order.fulfillmentType]}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-[var(--ui-text-muted)]">
                    <Clock3 size={13} strokeWidth={1.75} />
                    {timeLabel(order.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-4 text-[var(--ui-text-muted)]">
                  {itemCount || 0} artiklar
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <StatusBadge tone={STATUS_TONES[order.status]}>{STATUS_LABELS[order.status]}</StatusBadge>
                  <StatusBadge tone={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                    {order.paymentStatus === 'paid' ? 'Betald' : 'Obetald'}
                  </StatusBadge>
                  {order.isHeld ? <StatusBadge tone="neutral">Parkerad</StatusBadge> : null}
                </div>
              </button>

              <div className="fluffy-active-order-actions grid grid-cols-2 gap-1.5">
                {canReopen ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="compact"
                    className="h-9 px-2 text-xs"
                    onClick={() => onReopenOrder(order)}
                  >
                    <RotateCcw data-icon="inline-start" />
                    Öppna
                  </Button>
                ) : null}
                {order.isHeld ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="compact"
                    className="h-9 px-2 text-xs"
                    loading={busy === `send:${order.id}`}
                    onClick={() => onSendHeld(order)}
                  >
                    <Send data-icon="inline-start" />
                    Kök
                  </Button>
                ) : null}
                {canMarkPaid && order.paymentStatus !== 'paid' ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="compact"
                    className="h-9 px-2 text-xs"
                    loading={busy === `paid:${order.id}`}
                    onClick={() => onMarkPaid(order)}
                  >
                    <CreditCard data-icon="inline-start" />
                    Betald
                  </Button>
                ) : null}
                {next ? (
                  <Button
                    type="button"
                    size="compact"
                    className="h-9 px-2 text-xs"
                    disabled={nextDisabled}
                    loading={busy === `status:${order.id}:${next.status}`}
                    onClick={() => onMoveOrder(order, next.status)}
                  >
                    {next.label}
                  </Button>
                ) : null}
                {canAdmin && order.status !== 'cancelled' && order.status !== 'completed' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="compact"
                    className="h-9 px-2 text-xs"
                    loading={busy === `status:${order.id}:cancelled`}
                    onClick={() => onMoveOrder(order, 'cancelled')}
                  >
                    Makulera
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}

        <div className="fluffy-active-order-summary flex min-w-[220px] max-w-[260px] items-center justify-between gap-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide">Dagavslut</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[var(--ui-radius-md)] border border-[var(--ui-border)]">
                {dayBlocked ? <LockKeyhole size={20} strokeWidth={1.75} /> : <CalendarCheck size={20} strokeWidth={1.75} />}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--ui-accent)]">{dayBlocked ? 'Spärrad' : 'Redo'}</p>
                <p className="truncate text-xs text-[var(--ui-text-muted)]">{blocker}</p>
              </div>
            </div>
          </div>
          {canAdmin ? (
            <Button
              type="button"
              variant={dayBlocked ? 'ghost' : 'secondary'}
              size="icon"
              aria-label={dayBlocked ? 'Dagavslut spärrat' : 'Stäng dag'}
              disabled={dayBlocked}
              loading={busy === 'close-day'}
              onClick={onCloseDay}
            >
              <ChevronRight />
            </Button>
          ) : (
            <StatusBadge tone={dayBlocked ? 'warning' : 'success'}>{dayBlocked ? 'Blockerad' : 'Öppen'}</StatusBadge>
          )}
        </div>
      </div>
    </section>
  );
}

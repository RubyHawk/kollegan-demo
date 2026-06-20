'use client';

import { CalendarCheck, Clock3, RotateCcw, Send } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
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
  busy: string | null;
  canMarkPaid: boolean;
  canAdmin: boolean;
  onMarkPaid: (order: RestaurantOrder) => void;
  onSendHeld: (order: RestaurantOrder) => void;
  onMoveOrder: (order: RestaurantOrder, status: RestaurantOrderStatus) => void;
  onReopenOrder: (order: RestaurantOrder) => void;
  onCloseDay: () => void;
}) {
  if (!businessDay) return null;

  const activeCount = summary?.activeOrderCount ?? activeOrders.length;
  const unpaidCount = summary?.unpaidOrderCount ?? activeOrders.filter((order) => order.paymentStatus === 'unpaid').length;
  const dayBlocked = activeCount > 0 || unpaidCount > 0;
  const blocker = activeCount > 0
    ? `${activeCount} aktiva ordrar`
    : unpaidCount > 0
      ? `${unpaidCount} obetalda`
      : 'Redo att stänga';

  return (
    <section id="dagavslut" className="fluffy-active-orders-strip shrink-0 border-t border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2">
      <div className="flex gap-3 overflow-x-auto">
        <div className="fluffy-active-order-summary flex min-w-[230px] items-center justify-between gap-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CalendarCheck size={16} strokeWidth={1.75} />
              <p className="text-sm font-semibold">Dagavslut</p>
            </div>
            <p className="mt-1 truncate text-xs text-[var(--ui-text-muted)]">{blocker}</p>
          </div>
          {canAdmin ? (
            <Button
              type="button"
              variant={dayBlocked ? 'outline' : 'secondary'}
              size="compact"
              disabled={dayBlocked}
              loading={busy === 'close-day'}
              onClick={onCloseDay}
            >
              {dayBlocked ? 'Blockerad' : 'Stäng'}
            </Button>
          ) : (
            <StatusBadge tone={dayBlocked ? 'warning' : 'success'}>{dayBlocked ? 'Blockerad' : 'Öppen'}</StatusBadge>
          )}
        </div>

        {activeOrders.length === 0 ? (
          <div className="fluffy-active-order-empty flex min-w-[220px] items-center rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text-muted)]">
            Inga aktiva ordrar.
          </div>
        ) : activeOrders.map((order) => {
          const next = orderNextAction(order);
          const nextDisabled = next?.status === 'completed' && order.paymentStatus !== 'paid';
          const canReopen = order.isHeld && (order.kotStatus ?? 'not_sent') === 'not_sent';
          return (
            <article
              key={order.id}
              className="fluffy-active-order-ticket flex min-w-[300px] items-center gap-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2"
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                disabled={!canReopen}
                onClick={() => onReopenOrder(order)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold tabular-nums">#{order.orderNumber}</p>
                  <StatusBadge tone={STATUS_TONES[order.status]}>{STATUS_LABELS[order.status]}</StatusBadge>
                  <StatusBadge tone={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                    {order.paymentStatus === 'paid' ? 'Betald' : 'Obetald'}
                  </StatusBadge>
                  {order.isHeld ? <StatusBadge tone="neutral">Parkerad</StatusBadge> : null}
                </div>
                <p className="mt-1 truncate text-xs text-[var(--ui-text-muted)]">
                  {FULFILLMENT_LABELS[order.fulfillmentType]} · {order.items.map((item) => `${item.quantity} ${item.name}`).join(', ')}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--ui-text-muted)]">
                  <Clock3 size={13} strokeWidth={1.75} />
                  {timeLabel(order.createdAt)}
                </p>
              </button>

              {canReopen ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="compact"
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
                  loading={busy === `paid:${order.id}`}
                  onClick={() => onMarkPaid(order)}
                >
                  Betald
                </Button>
              ) : null}
              {next ? (
                <Button
                  type="button"
                  size="compact"
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
                  loading={busy === `status:${order.id}:cancelled`}
                  onClick={() => onMoveOrder(order, 'cancelled')}
                >
                  Makulera
                </Button>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

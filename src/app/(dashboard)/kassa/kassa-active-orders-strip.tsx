'use client';

import { Button } from '@shared/ui/button';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
import type {
  RestaurantBusinessDay,
  RestaurantOrder,
  RestaurantOrderStatus,
  RestaurantOrderSummary,
} from '@shared/lib/api/restaurant-orders.api';
import { money } from './kassa-helpers';

const STATUS_LABELS: Record<RestaurantOrderStatus, string> = {
  new: 'Ny',
  preparing: 'Tillagas',
  ready: 'Klar',
  completed: 'Utlämnad',
  cancelled: 'Makulerad',
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
  if (order.status === 'ready') return { status: 'completed', label: 'Utlämnad' };
  return null;
}

export function KassaActiveOrdersStrip({
  businessDay,
  summary,
  activeOrders,
  busy,
  canMarkPaid,
  canAdmin,
  canReadReports,
  onMarkPaid,
  onMoveOrder,
}: {
  businessDay: RestaurantBusinessDay | null;
  summary: RestaurantOrderSummary | null;
  activeOrders: RestaurantOrder[];
  busy: string | null;
  canMarkPaid: boolean;
  canAdmin: boolean;
  canReadReports: boolean;
  onMarkPaid: (order: RestaurantOrder) => void;
  onMoveOrder: (order: RestaurantOrder, status: RestaurantOrderStatus) => void;
}) {
  if (!businessDay) return null;

  return (
    <section className="shrink-0 border-t border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2">
      <div className="flex gap-3 overflow-x-auto">
        <div className="flex min-w-[220px] items-center justify-between rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2">
          <div>
            <p className="text-xs text-[var(--ui-text-muted)]">{canReadReports ? 'Försäljning' : 'Aktiva ordrar'}</p>
            <p className="text-lg font-semibold tabular-nums">
              {canReadReports ? money(summary?.salesCents ?? 0) : activeOrders.length}
            </p>
          </div>
          {canReadReports ? (
            <StatusBadge tone={(summary?.unpaidOrderCount ?? 0) > 0 ? 'warning' : 'success'}>
              {summary?.unpaidOrderCount ?? 0} obetalda
            </StatusBadge>
          ) : (
            <StatusBadge tone="neutral">Rapport låst</StatusBadge>
          )}
        </div>

        {activeOrders.length === 0 ? (
          <div className="flex min-w-[220px] items-center rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text-muted)]">
            Inga aktiva ordrar.
          </div>
        ) : activeOrders.map((order) => {
          const next = orderNextAction(order);
          const nextDisabled = next?.status === 'completed' && order.paymentStatus !== 'paid';
          return (
            <article
              key={order.id}
              className="flex min-w-[320px] items-center gap-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold tabular-nums">#{order.orderNumber}</p>
                  <StatusBadge tone={STATUS_TONES[order.status]}>{STATUS_LABELS[order.status]}</StatusBadge>
                  <StatusBadge tone={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                    {order.paymentStatus === 'paid' ? 'Betald' : 'Obetald'}
                  </StatusBadge>
                </div>
                <p className="mt-1 truncate text-xs text-[var(--ui-text-muted)]">
                  {order.items.map((item) => `${item.quantity} ${item.name}`).join(', ')}
                </p>
              </div>
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

'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@shared/ui/button';
import { InlineAlert } from '@shared/ui/inline-alert';
import { KpiStrip } from '@shared/ui/kpi-strip';
import { Panel } from '@shared/ui/panel';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
import {
  getRestaurantOrderSummary,
  listRestaurantOrders,
  updateRestaurantOrder,
  type RestaurantOrder,
  type RestaurantOrderStatus,
  type RestaurantOrderSummary,
} from '@shared/lib/api/restaurant-orders.api';

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

const moneyFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function money(cents: number) {
  return moneyFormatter.format(cents / 100);
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function orderLine(order: RestaurantOrder) {
  return order.items.map((item) => `${item.quantity} ${item.name}`).join(', ');
}

function itemNotes(order: RestaurantOrder) {
  return order.items
    .filter((item) => item.note)
    .map((item) => `${item.name}: ${item.note}`)
    .join(' · ');
}

type Filter = 'all' | 'active' | 'unpaid' | 'completed';

export function RestaurantOrdersPageClient({
  initialOrders,
  initialSummary,
  canMarkPaid,
  canAdmin,
  canReadReports,
}: {
  initialOrders: RestaurantOrder[];
  initialSummary: RestaurantOrderSummary | null;
  canMarkPaid: boolean;
  canAdmin: boolean;
  canReadReports: boolean;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [summary, setSummary] = useState(initialSummary);
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const filteredOrders = useMemo(() => {
    if (filter === 'active') return orders.filter((order) => ['new', 'preparing', 'ready'].includes(order.status));
    if (filter === 'unpaid') return orders.filter((order) => order.status !== 'cancelled' && order.paymentStatus === 'unpaid');
    if (filter === 'completed') return orders.filter((order) => order.status === 'completed');
    return orders;
  }, [filter, orders]);

  async function refresh() {
    const [nextOrders, nextSummary] = await Promise.all([
      listRestaurantOrders({}),
      canReadReports ? getRestaurantOrderSummary() : Promise.resolve(null),
    ]);
    setOrders(nextOrders);
    setSummary(nextSummary);
  }

  async function run(label: string, action: () => Promise<void>) {
    setBusy(label);
    setError('');
    try {
      await action();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function markPaid(order: RestaurantOrder) {
    await run(`paid:${order.id}`, async () => {
      await updateRestaurantOrder(order.id, { paymentStatus: 'paid', paymentMethod: order.paymentMethod ?? 'card' });
      await refresh();
    });
  }

  async function cancelOrder(order: RestaurantOrder) {
    await run(`cancel:${order.id}`, async () => {
      await updateRestaurantOrder(order.id, { status: 'cancelled' });
      await refresh();
    });
  }

  async function refundOrder(order: RestaurantOrder) {
    await run(`refund:${order.id}`, async () => {
      await updateRestaurantOrder(order.id, { paymentStatus: 'refunded', paymentMethod: order.paymentMethod });
      await refresh();
    });
  }

  return (
    <div data-brand="fluffys" className="fluffy-portal-page space-y-6 p-4 md:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-[var(--ui-accent-active)]">Fluffy&apos;s</p>
          <h1 className="text-2xl font-semibold text-[var(--ui-text)]">Ordrar och dagsförsäljning</h1>
          <p className="text-sm text-[var(--ui-text-muted)]">Intern kassa, aktiva ordrar och dagens säljdata.</p>
        </div>
        <Button asChild>
          <Link href="/kassa">Öppna kassa</Link>
        </Button>
      </header>

      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

      <KpiStrip
        items={[
          { id: 'sales', label: 'Försäljning', value: canReadReports ? money(summary?.salesCents ?? 0) : '-', detail: 'Betalda ordrar', tone: 'success' },
          { id: 'orders', label: 'Ordrar', value: summary?.orderCount ?? orders.length, detail: 'Exklusive makulerade', tone: 'info' },
          { id: 'active', label: 'Aktiva', value: summary?.activeOrderCount ?? orders.filter((order) => ['new', 'preparing', 'ready'].includes(order.status)).length, detail: 'I köket', tone: 'warning' },
          { id: 'unpaid', label: 'Obetalda', value: summary?.unpaidOrderCount ?? orders.filter((order) => order.paymentStatus === 'unpaid').length, detail: 'Behöver åtgärd', tone: (summary?.unpaidOrderCount ?? 0) > 0 ? 'warning' : 'success' },
          { id: 'average', label: 'Snittorder', value: canReadReports ? money(summary?.averageOrderCents ?? 0) : '-', detail: 'På betalda ordrar', tone: 'neutral' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Panel className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Orderlista</h2>
            <div className="flex flex-wrap gap-2">
              {[
                ['all', 'Alla'],
                ['active', 'Aktiva'],
                ['unpaid', 'Obetalda'],
                ['completed', 'Utlämnade'],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={filter === value ? 'default' : 'secondary'}
                  size="compact"
                  onClick={() => setFilter(value as Filter)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="fluffy-order-list overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)]">
            {filteredOrders.length === 0 ? (
              <p className="p-4 text-sm text-[var(--ui-text-muted)]">Inga ordrar i vyn.</p>
            ) : (
              <div className="divide-y divide-[var(--ui-border)]">
                {filteredOrders.map((order) => (
                  <article key={order.id} className="fluffy-order-row grid gap-3 p-4 lg:grid-cols-[120px_1fr_auto] lg:items-center">
                    <div>
                      <p className="text-lg font-semibold tabular-nums text-[var(--ui-text)]">#{order.orderNumber}</p>
                      <p className="text-xs text-[var(--ui-text-muted)]">{timeLabel(order.createdAt)}</p>
                    </div>
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge tone={STATUS_TONES[order.status]}>{STATUS_LABELS[order.status]}</StatusBadge>
                        <StatusBadge tone={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'refunded' ? 'neutral' : 'warning'}>
                          {order.paymentStatus === 'paid' ? 'Betald' : order.paymentStatus === 'refunded' ? 'Återbetald' : 'Obetald'}
                        </StatusBadge>
                        <StatusBadge tone="neutral">{money(order.totalCents)}</StatusBadge>
                      </div>
                      <p className="truncate text-sm text-[var(--ui-text)]">{orderLine(order)}</p>
                      {order.note ? (
                        <p className="truncate text-xs text-[var(--ui-text-muted)]">Notering: {order.note}</p>
                      ) : null}
                      {itemNotes(order) ? (
                        <p className="truncate text-xs text-[var(--ui-text-muted)]">Radnoteringar: {itemNotes(order)}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                      {canMarkPaid && order.paymentStatus === 'unpaid' && order.status !== 'cancelled' ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="compact"
                          loading={busy === `paid:${order.id}`}
                          onClick={() => markPaid(order)}
                        >
                          Markera betald
                        </Button>
                      ) : null}
                      {canAdmin && order.status !== 'cancelled' && order.status !== 'completed' ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="compact"
                          loading={busy === `cancel:${order.id}`}
                          onClick={() => cancelOrder(order)}
                        >
                          Makulera
                        </Button>
                      ) : null}
                      {canAdmin && order.paymentStatus === 'paid' ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="compact"
                          loading={busy === `refund:${order.id}`}
                          onClick={() => refundOrder(order)}
                        >
                          Återbetald
                        </Button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </Panel>

        <aside className="space-y-4">
          <Panel className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Bästsäljare idag</h2>
            {!canReadReports ? (
              <p className="text-sm text-[var(--ui-text-muted)]">Säljrapport kräver rapportåtkomst.</p>
            ) : summary?.bestSellers.length ? (
              <div className="space-y-3">
                {summary.bestSellers.map((item, index) => (
                  <div key={`${item.menuItemId ?? item.name}:${index}`} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--ui-text)]">{item.name}</p>
                      <p className="text-xs text-[var(--ui-text-muted)]">{item.quantity} sålda</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">{money(item.salesCents)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--ui-text-muted)]">Inga betalda orderrader ännu.</p>
            )}
          </Panel>

          <Panel className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Betalsätt</h2>
            {summary?.paymentMethods.length ? (
              <div className="space-y-3">
                {summary.paymentMethods.map((method) => (
                  <div key={method.method} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--ui-text)]">
                        {method.method === 'unknown' ? 'Okänt' : method.method}
                      </p>
                      <p className="text-xs text-[var(--ui-text-muted)]">{method.count} ordrar</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">{money(method.salesCents)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--ui-text-muted)]">Inga betalningar registrerade.</p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { InlineAlert } from '@shared/ui/inline-alert';
import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
import {
  listRestaurantOrders,
  updateRestaurantOrder,
  type RestaurantOrder,
  type RestaurantOrderStatus,
} from '@shared/lib/api/restaurant-orders.api';

type KitchenStatus = Extract<RestaurantOrderStatus, 'new' | 'preparing' | 'ready'>;

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

const COLUMNS: Array<{ status: KitchenStatus; title: string; detail: string }> = [
  { status: 'new', title: 'Nya', detail: 'Väntar på köket' },
  { status: 'preparing', title: 'Tillagas', detail: 'Pågående mat' },
  { status: 'ready', title: 'Klara', detail: 'Redo för utlämning' },
];

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
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function orderLine(order: RestaurantOrder) {
  return order.items.map((item) => `${item.quantity} ${item.name}`).join(', ');
}

function orderNotes(order: RestaurantOrder) {
  const itemNotes = order.items
    .filter((item) => item.note)
    .map((item) => `${item.name}: ${item.note}`)
    .join(' · ');
  return [order.note, itemNotes].filter(Boolean).join(' · ');
}

function nextActions(order: RestaurantOrder): Array<{ status: KitchenStatus; label: string }> {
  if (order.status === 'new') {
    return [
      { status: 'preparing', label: 'Tillagas' },
      { status: 'ready', label: 'Klar' },
    ];
  }
  if (order.status === 'preparing') return [{ status: 'ready', label: 'Klar' }];
  if (order.status === 'ready') return [{ status: 'preparing', label: 'Tillagas igen' }];
  return [];
}

export function KitchenOrdersClient({
  initialOrders,
  canUpdate,
}: {
  initialOrders: RestaurantOrder[];
  canUpdate: boolean;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const activeOrders = useMemo(
    () => [...orders]
      .filter((order) => ['new', 'preparing', 'ready'].includes(order.status))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders],
  );

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

  async function refresh() {
    await run('refresh', async () => {
      setOrders(await listRestaurantOrders({ activeOnly: true }));
    });
  }

  async function moveOrder(order: RestaurantOrder, status: KitchenStatus) {
    await run(`status:${order.id}:${status}`, async () => {
      const updated = await updateRestaurantOrder(order.id, { status });
      setOrders((current) => {
        const next = current.map((item) => (item.id === updated.id ? updated : item));
        return next.some((item) => item.id === updated.id) ? next : [updated, ...next];
      });
    });
  }

  return (
    <div data-brand="fluffys" className="space-y-5 p-4 md:p-6">
      <PageHeader
        eyebrow="Fluffy's"
        title="Kök"
        description="Aktiva beställningar för matberedning."
        meta={<StatusBadge tone="info">{activeOrders.length} aktiva</StatusBadge>}
        actions={(
          <Button
            type="button"
            variant="secondary"
            size="compact"
            loading={busy === 'refresh'}
            onClick={refresh}
          >
            Uppdatera
          </Button>
        )}
      />

      {!canUpdate ? (
        <InlineAlert tone="warning">
          Du kan se köksflödet men saknar behörighet att ändra orderstatus.
        </InlineAlert>
      ) : null}
      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

      <div className="grid gap-4 xl:grid-cols-3">
        {COLUMNS.map((column) => {
          const columnOrders = activeOrders.filter((order) => order.status === column.status);
          return (
            <Panel key={column.status} padding="none" className="overflow-hidden">
              <div className="border-b border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--ui-text)]">{column.title}</h2>
                    <p className="text-xs text-[var(--ui-text-muted)]">{column.detail}</p>
                  </div>
                  <StatusBadge tone={STATUS_TONES[column.status]}>{columnOrders.length}</StatusBadge>
                </div>
              </div>

              {columnOrders.length === 0 ? (
                <EmptyState
                  title="Tomt just nu"
                  description="När nya ordrar hamnar här visas de i den här kolumnen."
                />
              ) : (
                <div className="divide-y divide-[var(--ui-border)]">
                  {columnOrders.map((order) => (
                    <article key={order.id} className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-semibold tabular-nums text-[var(--ui-text)]">
                              #{order.orderNumber}
                            </p>
                            <StatusBadge tone={STATUS_TONES[order.status]}>
                              {STATUS_LABELS[order.status]}
                            </StatusBadge>
                            <StatusBadge tone={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                              {order.paymentStatus === 'paid' ? 'Betald' : 'Obetald'}
                            </StatusBadge>
                          </div>
                          <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                            {timeLabel(order.createdAt)} · {money(order.totalCents)}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm font-medium leading-5 text-[var(--ui-text)]">{orderLine(order)}</p>
                      {orderNotes(order) ? (
                        <p className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2 text-xs leading-5 text-[var(--ui-text-secondary)]">
                          {orderNotes(order)}
                        </p>
                      ) : null}

                      {nextActions(order).length ? (
                        <div className="flex flex-wrap gap-2">
                          {nextActions(order).map((action) => (
                            <Button
                              key={action.status}
                              type="button"
                              size="compact"
                              variant={action.status === 'ready' ? 'default' : 'secondary'}
                              disabled={!canUpdate}
                              loading={busy === `status:${order.id}:${action.status}`}
                              onClick={() => moveOrder(order, action.status)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

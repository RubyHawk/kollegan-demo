import Link from 'next/link';
import { Button } from '@shared/ui/button';
import { Panel } from '@shared/ui/panel';
import { StatusBadge } from '@shared/ui/status-badge';
import { ReceiptIcon } from '@shared/ui/icons';
import type {
  RestaurantBusinessDayView,
  RestaurantOrderSummary,
  RestaurantOrderView,
} from '@modules/supporting/restaurant-orders';

function formatMoney(cents: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function RestaurantOrdersDashboardPanel({
  businessDay,
  activeOrders,
  orderSummary,
  canWriteOrders,
  canReadOrderReports,
}: {
  businessDay: RestaurantBusinessDayView | null;
  activeOrders: RestaurantOrderView[];
  orderSummary: RestaurantOrderSummary | null;
  canWriteOrders: boolean;
  canReadOrderReports: boolean;
}) {
  return (
    <Panel className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ReceiptIcon />
          <h2 className="text-sm font-semibold text-[var(--ui-text)]">Dagens kassa</h2>
          <StatusBadge tone={businessDay ? 'success' : 'neutral'}>
            {businessDay ? 'Startad' : 'Stängd'}
          </StatusBadge>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWriteOrders ? (
            <Button asChild>
              <Link href="/kassa">{businessDay ? 'Öppna kassa' : 'Starta dagen'}</Link>
            </Button>
          ) : null}
          <Button asChild variant="secondary">
            <Link href="/ordrar">Ordrar</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border-l border-[var(--ui-border)] pl-3">
              <p className="text-xs font-medium uppercase text-[var(--ui-text-muted)]">Försäljning</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--ui-text)]">
                {canReadOrderReports ? formatMoney(orderSummary?.salesCents ?? 0) : '-'}
              </p>
            </div>
            <div className="border-l border-[var(--ui-border)] pl-3">
              <p className="text-xs font-medium uppercase text-[var(--ui-text-muted)]">Ordrar</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--ui-text)]">
                {orderSummary?.orderCount ?? activeOrders.length}
              </p>
            </div>
            <div className="border-l border-[var(--ui-border)] pl-3">
              <p className="text-xs font-medium uppercase text-[var(--ui-text-muted)]">Obetalda</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--ui-text)]">
                {orderSummary?.unpaidOrderCount ?? 0}
              </p>
            </div>
          </div>

          <div className="divide-y divide-[var(--ui-border)]">
            {activeOrders.length === 0 ? (
              <p className="py-3 text-sm text-[var(--ui-text-muted)]">Inga aktiva ordrar just nu.</p>
            ) : activeOrders.slice(0, 4).map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--ui-text)]">
                    Order #{order.orderNumber}
                  </p>
                  <p className="truncate text-xs text-[var(--ui-text-muted)]">
                    {order.items.map((item) => `${item.quantity} ${item.name}`).join(', ')}
                  </p>
                </div>
                <StatusBadge tone={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                  {order.paymentStatus === 'paid' ? 'Betald' : 'Obetald'}
                </StatusBadge>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase text-[var(--ui-text-muted)]">Bästsäljare</h3>
          {!canReadOrderReports ? (
            <p className="text-sm text-[var(--ui-text-muted)]">Säljrapport visas för roller med rapportåtkomst.</p>
          ) : orderSummary?.bestSellers.length ? (
            <div className="divide-y divide-[var(--ui-border)]">
              {orderSummary.bestSellers.slice(0, 4).map((item, index) => (
                <div key={`${item.menuItemId ?? item.name}:${index}`} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--ui-text)]">{item.name}</p>
                    <p className="text-xs text-[var(--ui-text-muted)]">{item.quantity} sålda</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-[var(--ui-text)]">{formatMoney(item.salesCents)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--ui-text-muted)]">Inga betalda orderrader ännu.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AttendanceControls } from '../(shell)/narvaro/attendance-controls';
import { Button } from '@shared/ui/button';
import { InlineAlert } from '@shared/ui/inline-alert';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
import { cn } from '@shared/lib/utils';
import type { AttendanceShift } from '@shared/lib/api/attendance.api';
import type { RestaurantMenuCategory, RestaurantMenuItem } from '@shared/lib/api/restaurant.api';
import {
  closeBusinessDay,
  createRestaurantOrder,
  getRestaurantOrderSummary,
  listRestaurantOrders,
  startBusinessDay,
  updateRestaurantOrder,
  type RestaurantBusinessDay,
  type RestaurantOrder,
  type RestaurantOrderStatus,
  type RestaurantOrderSummary,
  type RestaurantPaymentMethod,
} from '@shared/lib/api/restaurant-orders.api';

type DraftItem = {
  draftId: string;
  menuItemId: string | null;
  name: string;
  quantity: number;
  unitPriceCents: number;
  note: string | null;
};

const PAYMENT_METHODS: Array<{ value: RestaurantPaymentMethod; label: string }> = [
  { value: 'card', label: 'Kort' },
  { value: 'swish', label: 'Swish' },
  { value: 'cash', label: 'Kontant' },
  { value: 'other', label: 'Annat' },
];

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

const currencyFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function money(cents: number) {
  return currencyFormatter.format(cents / 100);
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function normalizePriceInput(value: string): number | null {
  const normalized = Number(value.replace(',', '.'));
  if (!Number.isFinite(normalized) || normalized < 0) return null;
  return Math.round(normalized * 100);
}

function orderNextAction(order: RestaurantOrder): { status: RestaurantOrderStatus; label: string } | null {
  if (order.status === 'new') return { status: 'preparing', label: 'Tillagas' };
  if (order.status === 'preparing') return { status: 'ready', label: 'Klar' };
  if (order.status === 'ready') return { status: 'completed', label: 'Utlämnad' };
  return null;
}

function availableItems(category: RestaurantMenuCategory): RestaurantMenuItem[] {
  return category.items.filter((item) => item.isAvailable && item.priceCents !== null);
}

export function KassaClient({
  initialMenu,
  initialBusinessDay,
  initialActiveOrders,
  initialSummary,
  initialShift,
  canCloseDay,
}: {
  initialMenu: RestaurantMenuCategory[];
  initialBusinessDay: RestaurantBusinessDay | null;
  initialActiveOrders: RestaurantOrder[];
  initialSummary: RestaurantOrderSummary | null;
  initialShift: AttendanceShift | null;
  canCloseDay: boolean;
}) {
  const categories = useMemo(
    () => initialMenu.filter((category) => category.isActive && availableItems(category).length > 0),
    [initialMenu],
  );
  const [businessDay, setBusinessDay] = useState(initialBusinessDay);
  const [activeOrders, setActiveOrders] = useState(initialActiveOrders);
  const [summary, setSummary] = useState(initialSummary);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id ?? '');
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<RestaurantPaymentMethod>('card');
  const [paidNow, setPaidNow] = useState(true);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (!selectedCategoryId && categories[0]) setSelectedCategoryId(categories[0].id);
  }, [categories, selectedCategoryId]);

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? categories[0] ?? null;
  const draftTotalCents = draftItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);

  async function refreshOrdersAndSummary() {
    const [orders, nextSummary] = await Promise.all([
      listRestaurantOrders({ activeOnly: true }),
      getRestaurantOrderSummary(),
    ]);
    setActiveOrders(orders);
    setSummary(nextSummary);
    setBusinessDay(nextSummary.businessDay);
  }

  async function run<T>(label: string, action: () => Promise<T>): Promise<T | null> {
    setBusy(label);
    setError('');
    setSuccess('');
    try {
      return await action();
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setBusy(null);
    }
  }

  function addMenuItem(item: RestaurantMenuItem) {
    const priceCents = item.priceCents;
    if (priceCents === null) return;
    setDraftItems((current) => {
      const existing = current.find((draft) => draft.menuItemId === item.id && !draft.note);
      if (existing) {
        return current.map((draft) => (
          draft.draftId === existing.draftId ? { ...draft, quantity: draft.quantity + 1 } : draft
        ));
      }
      return [
        ...current,
        {
          draftId: `${item.id}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
          menuItemId: item.id,
          name: item.name,
          quantity: 1,
          unitPriceCents: priceCents,
          note: null,
        },
      ];
    });
  }

  function changeQuantity(draftId: string, delta: number) {
    setDraftItems((current) => current.flatMap((item) => {
      if (item.draftId !== draftId) return [item];
      const quantity = item.quantity + delta;
      return quantity <= 0 ? [] : [{ ...item, quantity }];
    }));
  }

  function addCustomItem() {
    const priceCents = normalizePriceInput(customPrice);
    const name = customName.trim();
    if (!name || priceCents === null) {
      setError('Fyll i namn och pris för fri rad.');
      return;
    }
    setDraftItems((current) => [
      ...current,
      {
        draftId: `custom:${Date.now()}:${Math.random().toString(36).slice(2)}`,
        menuItemId: null,
        name,
        quantity: 1,
        unitPriceCents: priceCents,
        note: null,
      },
    ]);
    setCustomName('');
    setCustomPrice('');
    setError('');
  }

  async function handleStartDay() {
    await run('start-day', async () => {
      const day = await startBusinessDay();
      setBusinessDay(day);
      const nextSummary = await getRestaurantOrderSummary();
      setSummary(nextSummary);
      setSuccess('Dagen är startad.');
    });
  }

  async function handleCloseDay() {
    await run('close-day', async () => {
      const closed = await closeBusinessDay();
      setBusinessDay(null);
      setActiveOrders([]);
      setSummary({ ...(summary ?? {
        businessDay: null,
        salesCents: 0,
        orderCount: 0,
        paidOrderCount: 0,
        unpaidOrderCount: 0,
        activeOrderCount: 0,
        cancelledOrderCount: 0,
        averageOrderCents: 0,
        bestSellers: [],
        paymentMethods: [],
      }), businessDay: closed });
      setSuccess('Dagen är avslutad.');
    });
  }

  async function submitOrder() {
    if (!businessDay) {
      setError('Starta dagen först.');
      return;
    }
    if (draftItems.length === 0) {
      setError('Kvittot är tomt.');
      return;
    }

    await run('create-order', async () => {
      const order = await createRestaurantOrder({
        fulfillmentType: 'counter',
        paymentStatus: paidNow ? 'paid' : 'unpaid',
        paymentMethod: paidNow ? paymentMethod : null,
        items: draftItems.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.menuItemId ? undefined : item.name,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          note: item.note,
        })),
      });
      setDraftItems([]);
      setActiveOrders((current) => [order, ...current.filter((item) => item.id !== order.id)]);
      await refreshOrdersAndSummary();
      setSuccess(`Order ${order.orderNumber} skapad.`);
    });
  }

  async function markPaid(order: RestaurantOrder) {
    await run(`paid:${order.id}`, async () => {
      await updateRestaurantOrder(order.id, { paymentStatus: 'paid', paymentMethod });
      await refreshOrdersAndSummary();
    });
  }

  async function moveOrder(order: RestaurantOrder, status: RestaurantOrderStatus) {
    if (status === 'completed' && order.paymentStatus !== 'paid') {
      setError('Ordern behöver vara betald innan utlämning.');
      return;
    }
    await run(`status:${order.id}:${status}`, async () => {
      await updateRestaurantOrder(order.id, { status });
      await refreshOrdersAndSummary();
    });
  }

  return (
    <main
      data-brand="fluffys"
      className="min-h-dvh overflow-hidden bg-[var(--ui-bg)] text-[var(--ui-text)]"
    >
      <div className="flex h-dvh flex-col">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-[var(--ui-accent-active)]">Fluffy&apos;s kassa</p>
            <h1 className="truncate text-xl font-semibold">Driftläge</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge tone={online ? 'success' : 'warning'}>{online ? 'Online' : 'Offline'}</StatusBadge>
            <StatusBadge tone={businessDay ? 'success' : 'neutral'}>
              {businessDay ? `Startad ${timeLabel(businessDay.openedAt)}` : 'Stängd'}
            </StatusBadge>
            <Button asChild variant="secondary" size="compact">
              <Link href="/">Översikt</Link>
            </Button>
            {businessDay && canCloseDay ? (
              <Button
                type="button"
                variant="outline"
                size="compact"
                loading={busy === 'close-day'}
                onClick={handleCloseDay}
              >
                Avsluta dag
              </Button>
            ) : null}
          </div>
        </header>

        {!businessDay ? (
          <section className="grid min-h-0 flex-1 place-items-center p-4">
            <div className="w-full max-w-2xl space-y-4 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">Starta dagen</h2>
                <p className="text-sm text-[var(--ui-text-muted)]">Kassan öppnas för dagens interna beställningar.</p>
              </div>
              {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
              {success ? <InlineAlert tone="success">{success}</InlineAlert> : null}
              <AttendanceControls initialShift={initialShift} />
              <Button
                type="button"
                size="lg"
                className="h-14 w-full text-base"
                loading={busy === 'start-day'}
                onClick={handleStartDay}
              >
                Starta dagen
              </Button>
            </div>
          </section>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_430px]">
            <section className="grid min-h-0 grid-rows-[auto_1fr] border-r border-[var(--ui-border)]">
              <div className="flex min-h-[72px] items-center gap-2 overflow-x-auto border-b border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={cn(
                      'h-12 shrink-0 rounded-[var(--ui-radius-md)] border px-4 text-sm font-semibold transition-colors',
                      selectedCategory?.id === category.id
                        ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent)] text-[var(--ui-text-inverse)]'
                        : 'border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-hover)]',
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <div className="min-h-0 overflow-y-auto p-3">
                {selectedCategory ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">
                    {availableItems(selectedCategory).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addMenuItem(item)}
                        className="flex min-h-[112px] flex-col justify-between rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3 text-left shadow-sm transition-colors hover:border-[var(--ui-accent-border)] hover:bg-[var(--ui-surface-hover)] active:bg-[var(--ui-surface-selected)]"
                      >
                        <span className="line-clamp-3 text-base font-semibold leading-5">{item.name}</span>
                        <span className="mt-3 text-lg font-bold tabular-nums">{money(item.priceCents ?? 0)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid h-full place-items-center text-sm text-[var(--ui-text-muted)]">Ingen prissatt meny hittades.</div>
                )}
              </div>
            </section>

            <aside className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] bg-[var(--ui-surface)]">
              <section className="min-h-0 overflow-y-auto p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-[var(--ui-text-muted)]">Kvitto</p>
                    <p className="text-2xl font-semibold tabular-nums">{money(draftTotalCents)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="compact"
                    disabled={draftItems.length === 0}
                    onClick={() => setDraftItems([])}
                  >
                    Rensa
                  </Button>
                </div>

                {error ? <InlineAlert tone="danger" className="mb-3">{error}</InlineAlert> : null}
                {success ? <InlineAlert tone="success" className="mb-3">{success}</InlineAlert> : null}

                <div className="divide-y divide-[var(--ui-border)] rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)]">
                  {draftItems.length === 0 ? (
                    <p className="p-4 text-sm text-[var(--ui-text-muted)]">Inga rader.</p>
                  ) : draftItems.map((item) => (
                    <div key={item.draftId} className="flex items-center gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-[var(--ui-text-muted)]">{money(item.unitPriceCents)} styck</p>
                      </div>
                      <div className="flex h-10 items-center overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--ui-border)]">
                        <button type="button" className="h-10 w-10 text-lg" onClick={() => changeQuantity(item.draftId, -1)}>-</button>
                        <span className="w-10 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                        <button type="button" className="h-10 w-10 text-lg" onClick={() => changeQuantity(item.draftId, 1)}>+</button>
                      </div>
                      <p className="w-20 text-right text-sm font-semibold tabular-nums">{money(item.quantity * item.unitPriceCents)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-[1fr_92px_auto] gap-2">
                  <input
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                    placeholder="Fri rad"
                    className="h-10 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 text-sm outline-none focus:border-[var(--ui-accent-border)]"
                  />
                  <input
                    value={customPrice}
                    onChange={(event) => setCustomPrice(event.target.value)}
                    placeholder="Pris"
                    inputMode="decimal"
                    className="h-10 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 text-sm outline-none focus:border-[var(--ui-accent-border)]"
                  />
                  <Button type="button" variant="secondary" size="compact" onClick={addCustomItem}>
                    Lägg till
                  </Button>
                </div>
              </section>

              <section className="border-t border-[var(--ui-border)] p-4">
                <div className="mb-3 flex rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] p-1">
                  <button
                    type="button"
                    onClick={() => setPaidNow(true)}
                    className={cn(
                      'h-10 flex-1 rounded-[calc(var(--ui-radius-md)-2px)] text-sm font-semibold',
                      paidNow ? 'bg-[var(--ui-accent)] text-[var(--ui-text-inverse)]' : 'text-[var(--ui-text-secondary)]',
                    )}
                  >
                    Betald
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidNow(false)}
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
                      disabled={!paidNow}
                      onClick={() => setPaymentMethod(method.value)}
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

                <Button
                  type="button"
                  size="lg"
                  className="h-14 w-full text-base"
                  disabled={draftItems.length === 0 || !online}
                  loading={busy === 'create-order'}
                  onClick={submitOrder}
                >
                  Skapa order
                </Button>
              </section>
            </aside>
          </div>
        )}

        {businessDay ? (
          <section className="shrink-0 border-t border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2">
            <div className="flex gap-3 overflow-x-auto">
              <div className="flex min-w-[220px] items-center justify-between rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2">
                <div>
                  <p className="text-xs text-[var(--ui-text-muted)]">Försäljning</p>
                  <p className="text-lg font-semibold tabular-nums">{money(summary?.salesCents ?? 0)}</p>
                </div>
                <StatusBadge tone={(summary?.unpaidOrderCount ?? 0) > 0 ? 'warning' : 'success'}>
                  {summary?.unpaidOrderCount ?? 0} obetalda
                </StatusBadge>
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
                    {order.paymentStatus !== 'paid' ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="compact"
                        loading={busy === `paid:${order.id}`}
                        onClick={() => markPaid(order)}
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
                        onClick={() => moveOrder(order, next.status)}
                      >
                        {next.label}
                      </Button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

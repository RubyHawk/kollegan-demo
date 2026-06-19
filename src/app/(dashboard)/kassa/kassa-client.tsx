'use client';

import { useEffect, useMemo, useState } from 'react';
import { AttendanceControls } from '../(shell)/narvaro/attendance-controls';
import { Button } from '@shared/ui/button';
import { InlineAlert } from '@shared/ui/inline-alert';
import { StatusBadge } from '@shared/ui/status-badge';
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
  type RestaurantFulfillmentType,
  type RestaurantOrder,
  type RestaurantOrderStatus,
  type RestaurantOrderSummary,
  type RestaurantPaymentMethod,
} from '@shared/lib/api/restaurant-orders.api';
import { KassaActiveOrdersStrip } from './kassa-active-orders-strip';
import { KassaPortalRail } from './kassa-portal-rail';
import { KassaProductOptionsDialog } from './kassa-product-options-dialog';
import { KassaProductWorkbench } from './kassa-product-workbench';
import { KassaReceiptPanel } from './kassa-receipt-panel';
import {
  availableItems,
  type DraftItem,
  menuItemBasePrice,
  normalizePriceInput,
  timeLabel,
} from './kassa-helpers';

type CreateOrderAction = 'hold' | 'send' | 'print';

export function KassaClient({
  initialMenu,
  initialBusinessDay,
  initialActiveOrders,
  initialSummary,
  initialShift,
  canMarkPaid,
  canAdmin,
  canReadReports,
}: {
  initialMenu: RestaurantMenuCategory[];
  initialBusinessDay: RestaurantBusinessDay | null;
  initialActiveOrders: RestaurantOrder[];
  initialSummary: RestaurantOrderSummary | null;
  initialShift: AttendanceShift | null;
  canMarkPaid: boolean;
  canAdmin: boolean;
  canReadReports: boolean;
}) {
  const categories = useMemo(
    () => initialMenu.filter((category) => category.isActive && availableItems(category).length > 0),
    [initialMenu],
  );
  const [businessDay, setBusinessDay] = useState(initialBusinessDay);
  const [activeOrders, setActiveOrders] = useState(initialActiveOrders);
  const [summary, setSummary] = useState(initialSummary);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id ?? '');
  const [productSearch, setProductSearch] = useState('');
  const [optionsItem, setOptionsItem] = useState<RestaurantMenuItem | null>(null);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [fulfillmentType, setFulfillmentType] = useState<RestaurantFulfillmentType>('counter');
  const [tableLabel, setTableLabel] = useState('');
  const [bookingReference, setBookingReference] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<RestaurantPaymentMethod>('card');
  const [paidNow, setPaidNow] = useState(canMarkPaid);
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

  useEffect(() => {
    if (!canMarkPaid && paidNow) setPaidNow(false);
  }, [canMarkPaid, paidNow]);

  const draftTotalCents = draftItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  const discountCents = Math.min(draftTotalCents, normalizePriceInput(discountInput) ?? 0);
  const taxableCents = Math.max(0, draftTotalCents - discountCents);
  const taxRateBps = 1200;
  const taxCents = taxableCents > 0 ? Math.round((taxableCents * taxRateBps) / (10_000 + taxRateBps)) : 0;

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

  function lineSignature(item: Omit<DraftItem, 'draftId' | 'quantity'>) {
    return [
      item.menuItemId ?? 'custom',
      item.name,
      item.variantName ?? '',
      item.unitPriceCents,
      JSON.stringify(item.selectedModifiers),
      item.note ?? '',
    ].join(':');
  }

  function addDraftLine(line: Omit<DraftItem, 'draftId'>) {
    setDraftItems((current) => {
      const signature = lineSignature(line);
      const existing = current.find((draft) => lineSignature(draft) === signature);
      if (existing) {
        return current.map((draft) => (
          draft.draftId === existing.draftId ? { ...draft, quantity: draft.quantity + line.quantity } : draft
        ));
      }
      return [
        ...current,
        {
          ...line,
          draftId: `${line.menuItemId ?? 'custom'}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
        },
      ];
    });
  }

  function addMenuItem(item: RestaurantMenuItem) {
    const variants = item.variants ?? [];
    const modifierGroups = item.modifierGroups ?? [];
    const needsOptions = variants.filter((variant) => variant.isAvailable).length > 1
      || modifierGroups.some((group) => group.options.some((option) => option.isAvailable));
    if (needsOptions) {
      setOptionsItem(item);
      return;
    }
    const variant = variants.find((candidate) => candidate.isAvailable && candidate.isDefault)
      ?? variants.find((candidate) => candidate.isAvailable)
      ?? null;
    const priceCents = variant?.priceCents ?? menuItemBasePrice(item);
    if (priceCents === null) return;
    addDraftLine({
      menuItemId: item.id,
      name: item.name,
      quantity: 1,
      variantName: variant?.name ?? null,
      variantPriceCents: variant?.priceCents ?? null,
      selectedModifiers: [],
      modifierTotalCents: 0,
      unitPriceCents: priceCents,
      note: null,
    });
  }

  function changeQuantity(draftId: string, delta: number) {
    setDraftItems((current) => current.flatMap((item) => {
      if (item.draftId !== draftId) return [item];
      const quantity = item.quantity + delta;
      return quantity <= 0 ? [] : [{ ...item, quantity }];
    }));
  }

  function changeItemNote(draftId: string, note: string) {
    setDraftItems((current) => current.map((item) => (
      item.draftId === draftId ? { ...item, note: note.trim() ? note : null } : item
    )));
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
        variantName: null,
        variantPriceCents: null,
        selectedModifiers: [],
        modifierTotalCents: 0,
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
    return submitOrderWithAction('send');
  }

  async function submitOrderWithAction(action: CreateOrderAction) {
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
        fulfillmentType,
        tableLabel: fulfillmentType === 'dine_in' ? tableLabel.trim() || null : null,
        bookingReference: fulfillmentType === 'booking_linked' ? bookingReference.trim() || null : null,
        note: orderNote.trim() || null,
        discountCents,
        taxRateBps,
        isHeld: action === 'hold',
        sendToKitchen: action === 'send' || action === 'print',
        printReceipt: action === 'print',
        paymentStatus: canMarkPaid && paidNow ? 'paid' : 'unpaid',
        paymentMethod: canMarkPaid && paidNow ? paymentMethod : null,
        items: draftItems.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.menuItemId ? undefined : item.name,
          quantity: item.quantity,
          variantName: item.variantName,
          variantPriceCents: item.variantPriceCents,
          selectedModifiers: item.selectedModifiers,
          modifierTotalCents: item.modifierTotalCents,
          unitPriceCents: item.unitPriceCents,
          note: item.note,
        })),
      });
      setDraftItems([]);
      setOrderNote('');
      setDiscountInput('');
      setTableLabel('');
      setBookingReference('');
      setActiveOrders((current) => [order, ...current.filter((item) => item.id !== order.id)]);
      await refreshOrdersAndSummary();
      setSuccess(action === 'hold' ? `Order ${order.orderNumber} parkerad.` : `Order ${order.orderNumber} skickad.`);
    });
  }

  async function markPaid(order: RestaurantOrder) {
    if (!canMarkPaid) {
      setError('Du får inte markera betalning.');
      return;
    }
    await run(`paid:${order.id}`, async () => {
      await updateRestaurantOrder(order.id, { paymentStatus: 'paid', paymentMethod });
      await refreshOrdersAndSummary();
    });
  }

  async function sendHeldOrder(order: RestaurantOrder) {
    await run(`send:${order.id}`, async () => {
      await updateRestaurantOrder(order.id, { isHeld: false, kotStatus: 'sent' });
      await refreshOrdersAndSummary();
    });
  }

  async function moveOrder(order: RestaurantOrder, status: RestaurantOrderStatus) {
    if (status === 'completed' && order.isHeld) {
      setError('Skicka ordern till köket innan utlämning.');
      return;
    }
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
    <main data-brand="fluffys" className="min-h-dvh overflow-hidden bg-[var(--ui-bg)] text-[var(--ui-text)]">
      <div className="flex h-dvh">
        <KassaPortalRail />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-[var(--ui-accent-active)]">Fluffy&apos;s personalportal</p>
              <h1 className="truncate text-xl font-semibold">Kassa</h1>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <StatusBadge tone={online ? 'success' : 'warning'}>{online ? 'Online' : 'Offline'}</StatusBadge>
              <StatusBadge tone={businessDay ? 'success' : 'neutral'}>
                {businessDay ? `Startad ${timeLabel(businessDay.openedAt)}` : 'Stängd'}
              </StatusBadge>
              <StatusBadge tone={initialShift ? 'success' : 'neutral'}>
                {initialShift ? 'Incheckad' : 'Ej incheckad'}
              </StatusBadge>
              {canReadReports ? (
                <StatusBadge tone={(summary?.unpaidOrderCount ?? 0) > 0 ? 'warning' : 'success'}>
                  {summary?.unpaidOrderCount ?? 0} obetalda
                </StatusBadge>
              ) : null}
              {businessDay && canAdmin ? (
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
                  <p className="text-sm text-[var(--ui-text-muted)]">Kassan öppnas för dagens beställningar och dagavslut.</p>
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
            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_450px]">
              <KassaProductWorkbench
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                productSearch={productSearch}
                activeOrderCount={activeOrders.length}
                draftLineCount={draftItems.length}
                summary={summary}
                currentShift={initialShift}
                canReadReports={canReadReports}
                onProductSearchChange={setProductSearch}
                onSelectedCategoryChange={setSelectedCategoryId}
                onAddMenuItem={addMenuItem}
              />

              <KassaReceiptPanel
                draftItems={draftItems}
                draftTotalCents={draftTotalCents}
                discountCents={discountCents}
                taxCents={taxCents}
                totalCents={taxableCents}
                error={error}
                success={success}
                fulfillmentType={fulfillmentType}
                tableLabel={tableLabel}
                bookingReference={bookingReference}
                customName={customName}
                customPrice={customPrice}
                orderNote={orderNote}
                discountInput={discountInput}
                paymentMethod={paymentMethod}
                paidNow={paidNow}
                canMarkPaid={canMarkPaid}
                busy={busy}
                online={online}
                onClear={() => {
                  setDraftItems([]);
                  setOrderNote('');
                  setDiscountInput('');
                }}
                onFulfillmentTypeChange={setFulfillmentType}
                onTableLabelChange={setTableLabel}
                onBookingReferenceChange={setBookingReference}
                onChangeQuantity={changeQuantity}
                onChangeItemNote={changeItemNote}
                onCustomNameChange={setCustomName}
                onCustomPriceChange={setCustomPrice}
                onOrderNoteChange={setOrderNote}
                onDiscountInputChange={setDiscountInput}
                onAddCustomItem={addCustomItem}
                onPaidNowChange={setPaidNow}
                onPaymentMethodChange={setPaymentMethod}
                onSubmitOrder={submitOrder}
                onSubmitOrderAction={submitOrderWithAction}
              />
            </div>
          )}

          <KassaActiveOrdersStrip
            businessDay={businessDay}
            summary={summary}
            activeOrders={activeOrders}
            busy={busy}
            canMarkPaid={canMarkPaid}
            canAdmin={canAdmin}
            canReadReports={canReadReports}
            onMarkPaid={markPaid}
            onSendHeld={sendHeldOrder}
            onMoveOrder={moveOrder}
          />
        </div>

        <KassaProductOptionsDialog
          key={optionsItem?.id ?? 'empty-options'}
          item={optionsItem}
          open={Boolean(optionsItem)}
          onOpenChange={(open) => {
            if (!open) setOptionsItem(null);
          }}
          onAdd={addDraftLine}
        />
      </div>
    </main>
  );
}

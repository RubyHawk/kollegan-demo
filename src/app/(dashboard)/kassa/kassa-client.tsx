'use client';

import { useEffect, useMemo, useState } from 'react';
import { AttendanceControls } from '../(shell)/narvaro/attendance-controls';
import { Button } from '@shared/ui/button';
import { InlineAlert } from '@shared/ui/inline-alert';
import type { AttendanceShift } from '@shared/lib/api/attendance.api';
import type {
  MenuItemModifierGroup,
  MenuItemModifierOption,
  MenuItemVariant,
  RestaurantMenuCategory,
  RestaurantMenuItem,
} from '@shared/lib/api/restaurant.api';
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
  type RestaurantOrderModifierSelection,
  type RestaurantOrderStatus,
  type RestaurantOrderSummary,
  type RestaurantPaymentMethod,
} from '@shared/lib/api/restaurant-orders.api';
import { cn } from '@shared/lib/utils';
import { KassaActiveOrdersStrip } from './kassa-active-orders-strip';
import { KassaLineModifierPanel } from './kassa-line-modifier-panel';
import { KassaOperationalStrip } from './kassa-operational-strip';
import { KassaOrderInfoPanel } from './kassa-order-info-panel';
import { KassaPortalRail } from './kassa-portal-rail';
import { KassaProductWorkbench } from './kassa-product-workbench';
import { KassaReceiptPanel, type QuickExtra } from './kassa-receipt-panel';
import {
  availableItems,
  draftItemFromOrderItem,
  type DraftItem,
  menuItemBasePrice,
  menuItemFallbackImage,
  menuItemsById,
  normalizePriceInput,
} from './kassa-helpers';

type CreateOrderAction = 'hold' | 'send' | 'print' | 'pay';

const TAX_RATE_BPS = 1200;
const QUICK_EXTRA_LABELS = ['Läsk', 'Pizzasallad', 'Sås', 'Vitlöksbröd'] as const;

export function KassaClient({
  initialMenu,
  initialBusinessDay,
  initialActiveOrders,
  initialSummary,
  initialShift,
  employeeName,
  employeeEmail,
  canMarkPaid,
  canAdmin,
  canReadReports,
}: {
  initialMenu: RestaurantMenuCategory[];
  initialBusinessDay: RestaurantBusinessDay | null;
  initialActiveOrders: RestaurantOrder[];
  initialSummary: RestaurantOrderSummary | null;
  initialShift: AttendanceShift | null;
  employeeName: string;
  employeeEmail: string;
  canMarkPaid: boolean;
  canAdmin: boolean;
  canReadReports: boolean;
}) {
  const categories = useMemo(
    () => initialMenu.filter((category) => category.isActive && availableItems(category).length > 0),
    [initialMenu],
  );
  const menuMap = useMemo(() => menuItemsById(categories), [categories]);
  const allAvailableItems = useMemo(() => categories.flatMap((category) => availableItems(category).map((item) => ({
    item,
    categoryName: category.name,
  }))), [categories]);
  const categoryNameByItemId = useMemo(() => new Map(
    allAvailableItems.map(({ item, categoryName }) => [item.id, categoryName]),
  ), [allAvailableItems]);

  const [businessDay, setBusinessDay] = useState(initialBusinessDay);
  const [activeOrders, setActiveOrders] = useState(initialActiveOrders);
  const [summary, setSummary] = useState(initialSummary);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id ?? '');
  const [productSearch, setProductSearch] = useState('');
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<RestaurantOrder | null>(null);
  const [fulfillmentType, setFulfillmentType] = useState<RestaurantFulfillmentType>('counter');
  const [customerName, setCustomerName] = useState('');
  const [tableLabel, setTableLabel] = useState('');
  const [bookingReference, setBookingReference] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<RestaurantPaymentMethod>('card');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [orderInfoOpen, setOrderInfoOpen] = useState(false);
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

  const selectedDraftItem = draftItems.find((item) => item.draftId === selectedDraftId) ?? null;
  const selectedMenuItem = selectedDraftItem?.menuItemId ? menuMap.get(selectedDraftItem.menuItemId) ?? null : null;
  const contextPanel = orderInfoOpen ? 'order-info' : selectedDraftItem ? 'modifiers' : null;
  const draftTotalCents = draftItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  const discountCents = canAdmin ? Math.min(draftTotalCents, normalizePriceInput(discountInput) ?? 0) : 0;
  const taxableCents = Math.max(0, draftTotalCents - discountCents);
  const taxCents = taxableCents > 0 ? Math.round((taxableCents * TAX_RATE_BPS) / (10_000 + TAX_RATE_BPS)) : 0;
  const quickExtras = useMemo<QuickExtra[]>(() => QUICK_EXTRA_LABELS.map((label) => ({
    label,
    item: findQuickExtra(label, allAvailableItems),
  })), [allAvailableItems]);

  async function refreshOrdersAndSummary() {
    const [orders, nextSummary] = await Promise.all([
      listRestaurantOrders({ activeOnly: true }),
      canReadReports ? getRestaurantOrderSummary() : Promise.resolve(null),
    ]);
    setActiveOrders(orders);
    setSummary(nextSummary);
    if (nextSummary?.businessDay !== undefined) setBusinessDay(nextSummary.businessDay);
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

  function pushDraftLine(line: Omit<DraftItem, 'draftId'>) {
    const draftId = `${line.menuItemId ?? 'custom'}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    setDraftItems((current) => [...current, { ...line, draftId }]);
    setSelectedDraftId(draftId);
    setOrderInfoOpen(false);
  }

  function addMenuItem(item: RestaurantMenuItem) {
    const variant = (item.variants ?? []).find((candidate) => candidate.isAvailable && candidate.isDefault)
      ?? (item.variants ?? []).find((candidate) => candidate.isAvailable)
      ?? null;
    const basePriceCents = variant?.priceCents ?? menuItemBasePrice(item);
    if (basePriceCents === null) return;
    const categoryName = categoryNameByItemId.get(item.id) ?? '';
    pushDraftLine({
      menuItemId: item.id,
      imageUrl: item.imageUrl ?? menuItemFallbackImage(categoryName, item.name),
      name: item.name,
      quantity: 1,
      variantName: variant?.name ?? null,
      variantPriceCents: variant?.priceCents ?? null,
      selectedModifiers: [],
      modifierTotalCents: 0,
      basePriceCents,
      unitPriceCents: basePriceCents,
      note: null,
    });
  }

  function addCustomItem() {
    const priceCents = normalizePriceInput(customPrice);
    const name = customName.trim();
    if (!name || priceCents === null) {
      setError('Fyll i namn och pris för fri rad.');
      return;
    }
    pushDraftLine({
      menuItemId: null,
      imageUrl: null,
      name,
      quantity: 1,
      variantName: null,
      variantPriceCents: null,
      selectedModifiers: [],
      modifierTotalCents: 0,
      basePriceCents: priceCents,
      unitPriceCents: priceCents,
      note: null,
    });
    setCustomName('');
    setCustomPrice('');
    setError('');
  }

  function clearDraft() {
    setDraftItems([]);
    setSelectedDraftId(null);
    setEditingOrder(null);
    setCustomerName('');
    setOrderNote('');
    setDiscountInput('');
    setTableLabel('');
    setBookingReference('');
    setOrderInfoOpen(false);
  }

  function changeQuantity(draftId: string, delta: number) {
    let removed = false;
    setDraftItems((current) => current.flatMap((item) => {
      if (item.draftId !== draftId) return [item];
      const quantity = item.quantity + delta;
      if (quantity <= 0) {
        removed = true;
        return [];
      }
      return [{ ...item, quantity }];
    }));
    if (removed && selectedDraftId === draftId) setSelectedDraftId(null);
  }

  function removeDraftItem(draftId: string) {
    setDraftItems((current) => current.filter((item) => item.draftId !== draftId));
    if (selectedDraftId === draftId) setSelectedDraftId(null);
  }

  function changeItemNote(draftId: string, note: string) {
    setDraftItems((current) => current.map((item) => (
      item.draftId === draftId ? { ...item, note: note.trim() ? note : null } : item
    )));
  }

  function changeItemVariant(draftId: string, variant: MenuItemVariant) {
    setDraftItems((current) => current.map((item) => (
      item.draftId === draftId
        ? {
          ...item,
          variantName: variant.name,
          variantPriceCents: variant.priceCents,
          basePriceCents: variant.priceCents,
          unitPriceCents: variant.priceCents + item.modifierTotalCents,
        }
        : item
    )));
  }

  function toggleModifier(draftId: string, group: MenuItemModifierGroup, option: MenuItemModifierOption) {
    setDraftItems((current) => current.map((item) => {
      if (item.draftId !== draftId) return item;
      const groupMatches = (selection: RestaurantOrderModifierSelection) => (
        (selection.groupId && selection.groupId === group.id) || selection.groupName === group.name
      );
      const optionMatches = (selection: RestaurantOrderModifierSelection) => (
        (selection.optionId && selection.optionId === option.id) || selection.optionName === option.name
      );
      const alreadySelected = item.selectedModifiers.some((selection) => groupMatches(selection) && optionMatches(selection));
      let selectedModifiers = alreadySelected
        ? item.selectedModifiers.filter((selection) => !(groupMatches(selection) && optionMatches(selection)))
        : item.selectedModifiers;
      if (!alreadySelected) {
        const groupSelections = selectedModifiers.filter(groupMatches);
        if (group.maxSelected <= 1) selectedModifiers = selectedModifiers.filter((selection) => !groupMatches(selection));
        if (group.maxSelected > 1 && groupSelections.length >= group.maxSelected) {
          const first = groupSelections[0];
          selectedModifiers = selectedModifiers.filter((selection) => selection !== first);
        }
        selectedModifiers = [
          ...selectedModifiers,
          {
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            priceDeltaCents: option.priceDeltaCents,
          },
        ];
      }
      const modifierTotalCents = selectedModifiers.reduce((sum, selection) => sum + selection.priceDeltaCents, 0);
      return {
        ...item,
        selectedModifiers,
        modifierTotalCents,
        unitPriceCents: item.basePriceCents + modifierTotalCents,
      };
    }));
  }

  async function handleStartDay() {
    await run('start-day', async () => {
      const day = await startBusinessDay();
      setBusinessDay(day);
      if (canReadReports) setSummary(await getRestaurantOrderSummary());
      setSuccess('Dagen är startad.');
    });
  }

  async function handleCloseDay() {
    await run('close-day', async () => {
      const closed = await closeBusinessDay();
      setBusinessDay(null);
      setActiveOrders([]);
      setSummary((current) => ({ ...(current ?? emptySummary()), businessDay: closed }));
      setSuccess('Dagen är avslutad.');
    });
  }

  async function submitOrderWithAction(action: CreateOrderAction) {
    if (!businessDay) {
      setError('Starta dagen först.');
      return;
    }
    if (draftItems.length === 0) {
      setError('Ordern är tom.');
      return;
    }
    if (action === 'pay' && !canMarkPaid) {
      setError('Du får inte markera betalning.');
      return;
    }

    await run('create-order', async () => {
      const nextPaymentStatus = action === 'pay' || editingOrder?.paymentStatus === 'paid' ? 'paid' as const : 'unpaid' as const;
      const nextPaymentMethod = nextPaymentStatus === 'paid'
        ? action === 'pay'
          ? paymentMethod
          : editingOrder?.paymentMethod ?? paymentMethod
        : null;
      const commonPayload = {
        fulfillmentType,
        customerName: customerName.trim() || null,
        tableLabel: fulfillmentType === 'dine_in' ? tableLabel.trim() || null : null,
        bookingReference: fulfillmentType === 'booking_linked' ? bookingReference.trim() || null : null,
        note: orderNote.trim() || null,
        discountCents,
        taxRateBps: TAX_RATE_BPS,
        paymentStatus: nextPaymentStatus,
        paymentMethod: nextPaymentMethod,
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
      };
      const order = editingOrder
        ? await updateRestaurantOrder(editingOrder.id, {
          ...commonPayload,
          isHeld: action === 'hold',
          kotStatus: action === 'hold' ? 'not_sent' : action === 'print' ? 'printed' : 'sent',
          printReceipt: action === 'print',
        })
        : await createRestaurantOrder({
          ...commonPayload,
          isHeld: action === 'hold',
          sendToKitchen: action === 'send' || action === 'pay' || action === 'print',
          printReceipt: action === 'print',
        });
      clearDraft();
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
    const isKitchenStatus = status === 'preparing' || status === 'ready' || status === 'completed';
    if (isKitchenStatus && order.isHeld) {
      setError('Skicka ordern till köket innan statusen ändras.');
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

  function reopenOrder(order: RestaurantOrder) {
    if (!order.isHeld || (order.kotStatus ?? 'not_sent') !== 'not_sent') {
      setError('Bara parkerade ordrar som inte skickats till köket kan öppnas i kassan.');
      return;
    }
    const nextDraftItems = order.items.map((item) => draftItemFromOrderItem(
      item,
      item.menuItemId ? menuMap.get(item.menuItemId) : null,
    ));
    setEditingOrder(order);
    setDraftItems(nextDraftItems);
    setSelectedDraftId(nextDraftItems[0]?.draftId ?? null);
    setFulfillmentType(order.fulfillmentType);
    setCustomerName(order.customerName ?? '');
    setTableLabel(order.tableLabel ?? '');
    setBookingReference(order.bookingReference ?? '');
    setOrderNote(order.note ?? '');
    setDiscountInput(order.discountCents ? String(order.discountCents / 100).replace('.', ',') : '');
    setPaymentMethod(order.paymentMethod ?? paymentMethod);
    setOrderInfoOpen(false);
    setSuccess(`Order ${order.orderNumber} öppnad i kassan.`);
  }

  return (
    <main data-brand="fluffys" className="fluffy-pos-shell min-h-dvh overflow-hidden bg-[var(--ui-bg)] text-[var(--ui-text)]">
      <div className="flex h-dvh">
        <KassaPortalRail employeeName={employeeName} employeeEmail={employeeEmail} />

        <div className="fluffy-pos-stage flex min-w-0 flex-1 flex-col">
          <KassaOperationalStrip
            businessDay={businessDay}
            currentShift={initialShift}
            online={online}
            summary={summary}
            canReadReports={canReadReports}
            orderInfoOpen={orderInfoOpen}
            onToggleOrderInfo={() => setOrderInfoOpen((value) => !value)}
          />

          {!businessDay ? (
            <section className="grid min-h-0 flex-1 place-items-center p-4">
              <div className="fluffy-start-card flex w-full max-w-2xl flex-col gap-4 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-semibold">Starta dagen</h1>
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
            <div
              className={cn(
                'grid min-h-0 flex-1 grid-cols-1',
                contextPanel
                  ? 'xl:grid-cols-[minmax(0,1fr)_330px_430px] 2xl:grid-cols-[minmax(0,1fr)_360px_460px]'
                  : 'xl:grid-cols-[minmax(0,1fr)_430px] 2xl:grid-cols-[minmax(0,1fr)_460px]',
              )}
            >
              <KassaProductWorkbench
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                productSearch={productSearch}
                customName={customName}
                customPrice={customPrice}
                onProductSearchChange={setProductSearch}
                onSelectedCategoryChange={setSelectedCategoryId}
                onAddMenuItem={addMenuItem}
                onCustomNameChange={setCustomName}
                onCustomPriceChange={setCustomPrice}
                onAddCustomItem={addCustomItem}
              />

              {contextPanel === 'order-info' ? (
                <KassaOrderInfoPanel
                  orderNumber={editingOrder?.orderNumber ?? null}
                  draftLineCount={draftItems.length}
                  fulfillmentType={fulfillmentType}
                  customerName={customerName}
                  tableLabel={tableLabel}
                  bookingReference={bookingReference}
                  orderNote={orderNote}
                  discountInput={discountInput}
                  discountCents={discountCents}
                  paymentMethod={paymentMethod}
                  canAdmin={canAdmin}
                  canMarkPaid={canMarkPaid}
                  busy={busy}
                  online={online}
                  onClose={() => setOrderInfoOpen(false)}
                  onCustomerNameChange={setCustomerName}
                  onTableLabelChange={setTableLabel}
                  onBookingReferenceChange={setBookingReference}
                  onOrderNoteChange={setOrderNote}
                  onDiscountInputChange={setDiscountInput}
                  onPaymentMethodChange={setPaymentMethod}
                  onSubmitOrderAction={submitOrderWithAction}
                />
              ) : null}

              {contextPanel === 'modifiers' ? (
                <KassaLineModifierPanel
                  draftItem={selectedDraftItem}
                  menuItem={selectedMenuItem}
                  onClose={() => setSelectedDraftId(null)}
                  onVariantChange={changeItemVariant}
                  onModifierToggle={toggleModifier}
                  onNoteChange={changeItemNote}
                  onQuantityChange={changeQuantity}
                />
              ) : null}

              <KassaReceiptPanel
                orderNumber={editingOrder?.orderNumber ?? null}
                draftItems={draftItems}
                selectedDraftId={selectedDraftId}
                draftTotalCents={draftTotalCents}
                discountCents={discountCents}
                taxCents={taxCents}
                totalCents={taxableCents}
                error={error}
                success={success}
                fulfillmentType={fulfillmentType}
                quickExtras={quickExtras}
                canMarkPaid={canMarkPaid}
                busy={busy}
                online={online}
                onClear={clearDraft}
                onOpenOrderInfo={() => setOrderInfoOpen(true)}
                onFulfillmentTypeChange={setFulfillmentType}
                onSelectDraftItem={(draftId) => {
                  setSelectedDraftId(draftId);
                  setOrderInfoOpen(false);
                }}
                onChangeQuantity={changeQuantity}
                onRemoveDraftItem={removeDraftItem}
                onAddQuickExtra={addMenuItem}
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
            onMarkPaid={markPaid}
            onSendHeld={sendHeldOrder}
            onMoveOrder={moveOrder}
            onReopenOrder={reopenOrder}
            onCloseDay={handleCloseDay}
          />
        </div>
      </div>
    </main>
  );
}

function findQuickExtra(
  label: string,
  items: Array<{ item: RestaurantMenuItem; categoryName: string }>,
): RestaurantMenuItem | null {
  const query = label.toLowerCase();
  const exact = items.find(({ item }) => item.name.toLowerCase() === query);
  if (exact) return exact.item;
  const itemMatch = items.find(({ item }) => item.name.toLowerCase().includes(query));
  if (itemMatch) return itemMatch.item;
  const categoryMatch = items.find(({ categoryName }) => categoryName.toLowerCase().includes(query));
  return categoryMatch?.item ?? null;
}

function emptySummary(): RestaurantOrderSummary {
  return {
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
  };
}

'use client';

import { useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Check, Package, Pencil, Plus, Trash } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  formatVatRate,
  fromDisplayUnitPrice,
  getDisplayLineTotal,
  getDisplayUnitPrice,
} from '@modules/supporting/offers/domain/pricing';
import { cn } from '@shared/lib/utils';
import { Button, type ButtonProps } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { useToast } from '@shared/ui/toast/toast-context';
import { fmtSEK, linePriceLabel } from '../_lib/offers-dashboard-formatters';
import type { LineItem, OfferForm, OfferPriceDisplayMode, OfferProduct } from '../_store/types';
import { AutoGrowTextarea } from './auto-grow-textarea';
import { SortableRow } from './sortable-row';
import { OfferWizardProductPicker } from './offer-wizard-product-picker';

type SetOpenLines = (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
type NullableStringSetter = (value: string | null) => void;
type UpdateLine = (idx: number, field: keyof LineItem, value: string | number) => void;

type OfferWizardLineItemsCardProps = {
  form: OfferForm;
  fieldErrors: Record<string, string>;
  openLines: Set<number>;
  services: OfferProduct[];
  filteredServices: OfferProduct[];
  productPickerRow: number | null;
  productSearch: string;
  enforcedPriceDisplayMode: OfferPriceDisplayMode;
  setOpenLines: SetOpenLines;
  setProductPickerRow: (row: number | null) => void;
  setProductSearch: (value: string) => void;
  setActiveField: NullableStringSetter;
  updateLine: UpdateLine;
  addLine: () => void;
  removeLine: (idx: number) => void;
  restoreLine: (idx: number, line: LineItem) => void;
  reorderLines: (oldIdx: number, newIdx: number) => void;
  pickProduct: (idx: number, product: OfferProduct) => void;
};

function LineIconButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('size-7 shrink-0 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]', className)}
      {...props}
    >
      {children}
    </Button>
  );
}

export function OfferWizardLineItemsCard({
  form,
  fieldErrors,
  openLines,
  services,
  filteredServices,
  productPickerRow,
  productSearch,
  enforcedPriceDisplayMode,
  setOpenLines,
  setProductPickerRow,
  setProductSearch,
  setActiveField,
  updateLine,
  addLine,
  removeLine,
  restoreLine,
  reorderLines,
  pickProduct,
}: OfferWizardLineItemsCardProps) {
  const { addToast } = useToast();
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const lineItemIds = useMemo(
    () => form.lineItems.map((item, idx) => item.id ?? `new-${idx}`),
    [form.lineItems],
  );

  const setLineUnitPriceFromDisplay = (idx: number, displayValue: number) => {
    const item = form.lineItems[idx];
    if (!item) return;
    updateLine(idx, 'unitPrice', fromDisplayUnitPrice(displayValue, item.vatRate, enforcedPriceDisplayMode));
  };

  const setLineVatRate = (idx: number, nextRate: number) => {
    const item = form.lineItems[idx];
    if (!item) return;
    if (enforcedPriceDisplayMode === 'inclusive') {
      const currentDisplayUnitPrice = getDisplayUnitPrice(item, enforcedPriceDisplayMode);
      updateLine(idx, 'vatRate', nextRate);
      updateLine(idx, 'unitPrice', fromDisplayUnitPrice(currentDisplayUnitPrice, nextRate, enforcedPriceDisplayMode));
      return;
    }
    updateLine(idx, 'vatRate', nextRate);
  };

  function handleLineItemDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = lineItemIds.indexOf(active.id as string);
    const newIdx = lineItemIds.indexOf(over.id as string);
    if (oldIdx === -1 || newIdx === -1) return;
    reorderLines(oldIdx, newIdx);
  }

  function removeLineWithUndo(idx: number) {
    const removed = form.lineItems[idx];
    if (!removed) return;
    removeLine(idx);
    addToast({
      color: 'amber',
      icon: '↶',
      message: 'Raden togs bort.',
      action: {
        label: 'Ångra',
        onClick: () => restoreLine(idx, removed),
      },
    });
  }

  return (
    <div className="rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)]">
      <div className="flex items-center gap-3 px-4 pb-3 pt-3.5">
        <div className="size-4 shrink-0 rounded-full border-2 border-[var(--ui-accent)]" />
        <span className="flex-1 text-xs font-semibold uppercase text-[var(--ui-text-secondary)]">Rader</span>
        {fieldErrors.lineItems ? <span className="text-[10px] text-[var(--ui-danger-text)]">{fieldErrors.lineItems}</span> : null}
      </div>
      <div className="px-4 pb-3 text-[11px] leading-5 text-[var(--ui-text-muted)]">
        Välj befintliga produkter per rad och justera sedan pris, rabatt och moms direkt i offerten.
      </div>
      <div className="border-t border-[var(--ui-border)]">
        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleLineItemDragEnd}>
          <SortableContext items={lineItemIds} strategy={verticalListSortingStrategy}>
            {form.lineItems.map((item, idx) => {
              const displayUnitPrice = getDisplayUnitPrice(item, enforcedPriceDisplayMode);
              const displayLineTotal = getDisplayLineTotal(item, enforcedPriceDisplayMode);
              const lineComplete = item.description.trim().length > 0 && item.quantity > 0;
              const isOpen = openLines.has(idx);

              return (
                <SortableRow key={lineItemIds[idx]} id={lineItemIds[idx]}>
                  {(grip) => (
                    <AnimatePresence mode="wait">
                      {!isOpen && lineComplete ? (
                        <motion.div
                          key="collapsed"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className={cn('group/row flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-[var(--ui-surface-hover)]', idx > 0 && 'border-t border-[var(--ui-border)]')}
                        >
                          {grip}
                          <LineNumber value={idx + 1} />
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 whitespace-pre-wrap break-words text-xs font-medium text-[var(--ui-text)]" title={item.description}>
                              {item.description}
                            </p>
                            <p className="mt-0.5 text-[10px] tabular-nums text-[var(--ui-text-muted)]">
                              {item.quantity} {item.unit ? item.unit : 'st'} x {fmtSEK(displayUnitPrice)}
                              {item.discount > 0 ? ` - ${item.discount}%` : ''} · {formatVatRate(item.vatRate)}
                            </p>
                          </div>
                          <p className="shrink-0 tabular-nums text-xs font-semibold text-[var(--ui-text)]">{fmtSEK(displayLineTotal)}</p>
                          <LineIconButton
                            title="Redigera"
                            aria-label="Redigera rad"
                            onClick={() => setOpenLines((lines) => {
                              const next = new Set(lines);
                              next.add(idx);
                              return next;
                            })}
                            className="opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 hover:text-[var(--ui-accent)]"
                          >
                            <Pencil size={16} strokeWidth={1.75} aria-hidden />
                          </LineIconButton>
                          <LineIconButton
                            onClick={() => removeLineWithUndo(idx)}
                            className={cn('opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 hover:bg-[var(--ui-danger-bg)] hover:text-[var(--ui-danger-text)]', form.lineItems.length > 1 ? '' : 'invisible')}
                            aria-label="Ta bort rad"
                            title="Ta bort rad"
                          >
                            <Trash size={16} strokeWidth={1.75} aria-hidden />
                          </LineIconButton>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="expanded"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className={cn('group/row space-y-2.5 px-3 py-3', idx > 0 && 'border-t border-[var(--ui-border)]')}
                        >
                          <div className="flex items-start gap-2">
                            {grip}
                            <LineNumber value={idx + 1} />
                            <div className="flex-1 space-y-1.5">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <div className="relative flex-1">
                                  <AutoGrowTextarea
                                    value={item.description}
                                    onChange={(event) => updateLine(idx, 'description', event.target.value)}
                                    onFocus={() => setActiveField('Rad ' + (idx + 1))}
                                    placeholder="Tjänst eller produkt"
                                    minRows={2}
                                    className={cn(
                                      'w-full resize-none rounded-[var(--ui-radius-md)] border bg-[var(--ui-surface)] px-3 py-2 text-xs leading-5 text-[var(--ui-text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)]',
                                      fieldErrors[`line_${idx}_description`] ? 'border-[var(--ui-danger-border)]' : 'border-[var(--ui-border)]',
                                    )}
                                  />
                                </div>
                                {services.length > 0 ? (
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                      setProductPickerRow(productPickerRow === idx ? null : idx);
                                      setProductSearch('');
                                    }}
                                    title="Välj från produktbibliotek"
                                    className="shrink-0"
                                  >
                                    <Package size={16} strokeWidth={1.75} aria-hidden />
                                    {productPickerRow === idx ? 'Stäng' : item.description.trim() ? 'Byt produkt' : 'Välj produkt'}
                                  </Button>
                                ) : null}
                              </div>
                              {fieldErrors[`line_${idx}_description`] ? (
                                <p className="mt-0.5 text-[10px] text-[var(--ui-danger-text)]">{fieldErrors[`line_${idx}_description`]}</p>
                              ) : null}
                            </div>
                            <LineIconButton
                              onClick={() => removeLineWithUndo(idx)}
                              className={cn('hover:bg-[var(--ui-danger-bg)] hover:text-[var(--ui-danger-text)]', form.lineItems.length > 1 ? 'opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100' : 'invisible')}
                              aria-label="Ta bort rad"
                              title="Ta bort rad"
                            >
                              <Trash size={16} strokeWidth={1.75} aria-hidden />
                            </LineIconButton>
                          </div>

                          {productPickerRow === idx ? (
                            <OfferWizardProductPicker
                              services={services}
                              filteredServices={filteredServices}
                              productSearch={productSearch}
                              enforcedPriceDisplayMode={enforcedPriceDisplayMode}
                              setProductSearch={setProductSearch}
                              setProductPickerRow={setProductPickerRow}
                              pickProduct={(product) => pickProduct(idx, product)}
                            />
                          ) : null}

                          <div className="flex items-end gap-1.5">
                            <div className="w-16 shrink-0">
                              <label className="mb-1 block text-[10px] text-[var(--ui-text-muted)]">Antal</label>
                              <Input
                                type="number"
                                min={0}
                                step={0.1}
                                value={item.quantity}
                                onChange={(event) => updateLine(idx, 'quantity', parseFloat(event.target.value) || 0)}
                                onFocus={(event) => {
                                  try {
                                    const length = event.target.value.length;
                                    event.target.setSelectionRange(length, length);
                                  } catch {}
                                  setActiveField('Rad ' + (idx + 1));
                                }}
                                className={cn('h-8 px-2 text-center text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none', fieldErrors[`line_${idx}_quantity`] && 'border-[var(--ui-danger-border)]')}
                              />
                              {fieldErrors[`line_${idx}_quantity`] ? (
                                <p className="mt-0.5 text-center text-[10px] text-[var(--ui-danger-text)]">{fieldErrors[`line_${idx}_quantity`]}</p>
                              ) : null}
                            </div>
                            <span className="shrink-0 select-none pb-2 text-xs text-[var(--ui-text-muted)]">x</span>
                            <div className="min-w-0 flex-1">
                              <label className="mb-1 block text-[10px] text-[var(--ui-text-muted)]">A-pris ({linePriceLabel(item.vatRate)})</label>
                              <Input
                                type="number"
                                min={0}
                                value={displayUnitPrice}
                                onChange={(event) => setLineUnitPriceFromDisplay(idx, parseFloat(event.target.value) || 0)}
                                onFocus={(event) => {
                                  try {
                                    const length = event.target.value.length;
                                    event.target.setSelectionRange(length, length);
                                  } catch {}
                                  setActiveField('Rad ' + (idx + 1));
                                }}
                                className="h-8 px-2 text-right text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              />
                            </div>
                            <span className="shrink-0 select-none pb-2 text-xs text-[var(--ui-text-muted)]">=</span>
                            <div className="min-w-[60px] shrink-0 pb-1.5 text-right">
                              <p className="mb-1 text-[10px] text-[var(--ui-text-muted)]">Summa</p>
                              <p className="tabular-nums text-xs font-semibold text-[var(--ui-text)]">{fmtSEK(displayLineTotal)}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="shrink-0 text-[10px] text-[var(--ui-text-muted)]">Moms:</span>
                            <div className="flex gap-0.5 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-0.5">
                              {([0, 0.06, 0.12, 0.25] as const).map((rate) => (
                                <button
                                  key={rate}
                                  type="button"
                                  onClick={() => setLineVatRate(idx, rate)}
                                  className={cn(
                                    'rounded-[var(--ui-radius-sm)] px-1.5 py-0.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
                                    item.vatRate === rate
                                      ? 'border border-[var(--ui-accent-border)] bg-[var(--ui-surface)] text-[var(--ui-text)]'
                                      : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text-secondary)]',
                                  )}
                                >
                                  {Math.round(rate * 100)}%
                                </button>
                              ))}
                            </div>
                            <div className="ml-auto flex shrink-0 items-center gap-1">
                              <span className="text-[10px] text-[var(--ui-text-muted)]">Rabatt:</span>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={item.discount}
                                onChange={(event) => updateLine(idx, 'discount', parseFloat(event.target.value) || 0)}
                                onFocus={(event) => {
                                  try {
                                    const length = event.target.value.length;
                                    event.target.setSelectionRange(length, length);
                                  } catch {}
                                }}
                                className="h-7 w-11 px-1.5 text-center text-[10px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              />
                              <span className="text-[10px] text-[var(--ui-text-muted)]">%</span>
                            </div>
                          </div>

                          <div className="mt-0.5 flex items-center justify-between border-t border-[var(--ui-border)] pt-3">
                            {!lineComplete ? <span className="text-[10px] text-[var(--ui-text-muted)]">Fyll i beskrivning och antal</span> : null}
                            <div className="flex-1" />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={!lineComplete}
                              onClick={() => {
                                if (lineComplete) {
                                  setOpenLines((lines) => {
                                    const next = new Set(lines);
                                    next.delete(idx);
                                    return next;
                                  });
                                }
                              }}
                            >
                              <Check size={16} strokeWidth={1.75} aria-hidden />
                              Klar
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </SortableRow>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
      <div className="border-t border-[var(--ui-border)] p-2">
        <Button type="button" variant="secondary" onClick={addLine} className="w-full border-dashed">
          <Plus size={16} strokeWidth={1.75} aria-hidden />
          Lägg till produkt eller tjänst
        </Button>
      </div>
    </div>
  );
}

function LineNumber({ value }: { value: number }) {
  return (
    <span className="flex size-5 shrink-0 select-none items-center justify-center rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[10px] font-semibold tabular-nums text-[var(--ui-text-secondary)]">
      {value}
    </span>
  );
}

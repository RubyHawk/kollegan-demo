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
import { AnimatePresence, motion } from 'framer-motion';
import {
  formatVatRate,
  fromDisplayUnitPrice,
  getDisplayLineTotal,
  getDisplayUnitPrice,
} from '@modules/supporting/offers/domain/pricing';
import { cn } from '@shared/lib/utils';
import { AutoGrowTextarea } from './auto-grow-textarea';
import { SortableRow } from './sortable-row';
import type { LineItem, OfferForm, OfferPriceDisplayMode, OfferProduct } from '../_store/types';
import { fmtSEK, linePriceLabel } from '../_lib/offers-dashboard-formatters';

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
  reorderLines: (oldIdx: number, newIdx: number) => void;
  pickProduct: (idx: number, product: OfferProduct) => void;
};

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
  reorderLines,
  pickProduct,
}: OfferWizardLineItemsCardProps) {
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

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
        <div className="w-4 h-4 rounded-full border-2 border-[var(--accent)] shrink-0" />
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Rader
        </span>
        {fieldErrors.lineItems && <span className="text-[10px] text-red-500">{fieldErrors.lineItems}</span>}
      </div>
      <div className="px-4 pb-3 text-[11px] leading-5 text-[var(--text-muted)]">
        Välj befintliga produkter per rad och justera sedan pris, rabatt och moms direkt i offerten.
      </div>
      <div className="border-t border-[var(--border)]/40">
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
                        <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className={cn('flex items-center gap-2.5 px-3 py-2.5 group/row hover:bg-[var(--surface-alt)] transition-colors', idx > 0 && 'border-t border-[var(--border)]/40')}>
                          {grip}
                          <span className="shrink-0 w-5 h-5 rounded-md bg-[var(--surface-alt)] text-[var(--text-secondary)] text-[10px] font-semibold flex items-center justify-center tabular-nums select-none border border-[var(--border)]">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="line-clamp-2 whitespace-pre-wrap break-words text-xs font-medium text-[var(--text-primary)]" title={item.description}>
                              {item.description}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 tabular-nums">
                              {item.quantity} {item.unit ? item.unit : 'st'} × {fmtSEK(displayUnitPrice)}{item.discount > 0 ? ` − ${item.discount}%` : ''} · {formatVatRate(item.vatRate)}
                            </p>
                          </div>
                          <p className="text-xs font-semibold text-[var(--text-primary)] tabular-nums shrink-0">{fmtSEK(displayLineTotal)}</p>
                          <button type="button" title="Redigera" onClick={() => setOpenLines((s) => { const n = new Set(s); n.add(idx); return n; })} className="shrink-0 p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface)] transition-colors opacity-0 group-hover/row:opacity-100">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button type="button" onClick={() => removeLine(idx)} className={cn('shrink-0 p-1.5 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover/row:opacity-100', form.lineItems.length > 1 ? '' : 'invisible')}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                            </svg>
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className={cn('px-3 py-3 space-y-2.5 group/row', idx > 0 && 'border-t border-[var(--border)]/40')}>
                          <div className="flex items-start gap-2">
                            {grip}
                            <span className="shrink-0 w-5 h-5 rounded-md bg-[var(--surface-alt)] text-[var(--text-secondary)] text-[10px] font-semibold flex items-center justify-center tabular-nums select-none border border-[var(--border)]">
                              {idx + 1}
                            </span>
                            <div className="flex-1 space-y-1.5">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <div className="flex-1 relative">
                                  <AutoGrowTextarea
                                    value={item.description}
                                    onChange={(e) => updateLine(idx, 'description', e.target.value)}
                                    onFocus={() => setActiveField('Rad ' + (idx + 1))}
                                    placeholder="Tjänst eller produkt"
                                    minRows={2}
                                    className={`w-full rounded-lg border bg-[var(--surface-alt)] px-3 py-2 text-xs leading-5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15 transition-all resize-none ${fieldErrors[`line_${idx}_description`] ? 'border-red-400' : 'border-[var(--border)] focus:border-[var(--accent)]'}`}
                                  />
                                </div>
                                {services.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => { setProductPickerRow(productPickerRow === idx ? null : idx); setProductSearch(''); }}
                                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-xs font-medium text-[var(--text-secondary)] transition-all hover:border-[var(--accent)]/45 hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                                    title="Välj från produktbibliotek"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                                    </svg>
                                    {productPickerRow === idx ? 'Stäng' : item.description.trim() ? 'Byt produkt' : 'Välj produkt'}
                                  </button>
                                )}
                              </div>
                              {fieldErrors[`line_${idx}_description`] && (
                                <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors[`line_${idx}_description`]}</p>
                              )}
                            </div>
                            <button type="button" onClick={() => removeLine(idx)} className={cn('shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all', form.lineItems.length > 1 ? 'opacity-0 group-hover/row:opacity-100' : 'invisible')}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                              </svg>
                            </button>
                          </div>
                          {productPickerRow === idx && (
                            <div className="relative z-50">
                              <div className="absolute top-0 left-0 right-0 bg-[var(--surface-0)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)]">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[var(--text-muted)]">
                                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                  </svg>
                                  <input autoFocus value={productSearch} onChange={(e) => setProductSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setProductPickerRow(null); }} placeholder="Sök namn, beskrivning eller enhet..." className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none" />
                                  <kbd className="shrink-0 text-[10px] text-[var(--text-muted)] border border-[var(--border)] rounded px-1 py-0.5">Esc</kbd>
                                </div>
                                <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border)]/50">
                                  {filteredServices.length === 0 ? (
                                    <div className="px-4 py-6 text-center">
                                      <p className="text-xs font-medium text-[var(--text-secondary)]">Inga produkter hittades</p>
                                      <p className="mt-1 text-[10px] text-[var(--text-muted)]">Prova att söka på namn, beskrivning eller enhet.</p>
                                    </div>
                                  ) : filteredServices.map((p) => (
                                    <button key={p.id} type="button" onClick={() => pickProduct(idx, p)}
                                      className="w-full text-left px-4 py-3 hover:bg-[var(--surface-active)] transition-colors flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0 text-[var(--accent)] text-[11px] font-bold">
                                        {p.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{p.name}</p>
                                        <p className="text-[10px] text-[var(--text-muted)]">
                                          {fmtSEK(getDisplayUnitPrice(p, enforcedPriceDisplayMode))}{p.unit ? ` / ${p.unit}` : ''} · {formatVatRate(p.vatRate)}
                                        </p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                                {services.length > 0 && (
                                  <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[10px] text-[var(--text-muted)]">
                                    <span>{filteredServices.length} av {services.length} produkter</span>
                                    {productSearch.trim() && (
                                      <button
                                        type="button"
                                        onClick={() => setProductSearch('')}
                                        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)]"
                                      >
                                        Rensa sökning
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex items-end gap-1.5">
                            <div className="w-16 shrink-0">
                              <label className="block text-[10px] text-[var(--text-muted)] mb-1">Antal</label>
                              <input type="number" min={0} step={0.1} value={item.quantity} onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)} onFocus={(e) => { try { const l = e.target.value.length; e.target.setSelectionRange(l, l); } catch {} setActiveField('Rad ' + (idx + 1)); }} className={`w-full rounded-lg border bg-[var(--surface-alt)] px-2 py-1.5 text-xs text-center text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${fieldErrors[`line_${idx}_quantity`] ? 'border-red-400' : 'border-[var(--border)] focus:border-[var(--accent)]'}`} />
                              {fieldErrors[`line_${idx}_quantity`] && (
                                <p className="text-[10px] text-red-500 mt-0.5 text-center">{fieldErrors[`line_${idx}_quantity`]}</p>
                              )}
                            </div>
                            <span className="pb-2 text-[var(--text-muted)] text-xs shrink-0 select-none">×</span>
                            <div className="flex-1 min-w-0">
                              <label className="block text-[10px] text-[var(--text-muted)] mb-1">
                                Á-pris ({linePriceLabel(item.vatRate)})
                              </label>
                              <input type="number" min={0} value={displayUnitPrice} onChange={(e) => setLineUnitPriceFromDisplay(idx, parseFloat(e.target.value) || 0)} onFocus={(e) => { try { const l = e.target.value.length; e.target.setSelectionRange(l, l); } catch {} setActiveField('Rad ' + (idx + 1)); }} className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-1.5 text-xs text-right text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                            </div>
                            <span className="pb-2 text-[var(--text-muted)] text-xs shrink-0 select-none">=</span>
                            <div className="shrink-0 text-right min-w-[60px] pb-1.5">
                              <p className="text-[10px] text-[var(--text-muted)] mb-1">Summa</p>
                              <p className="text-xs font-semibold text-[var(--text-primary)] tabular-nums">{fmtSEK(displayLineTotal)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-[var(--text-muted)] shrink-0">Moms:</span>
                            <div className="flex gap-0.5 rounded-md border border-[var(--border)] bg-[var(--surface-alt)] p-0.5">
                              {([0, 0.06, 0.12, 0.25] as const).map((rate) => (
                                <button key={rate} type="button" onClick={() => setLineVatRate(idx, rate)} className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-all ${item.vatRate === rate ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                                  {Math.round(rate * 100)}%
                                </button>
                              ))}
                            </div>
                            <div className="ml-auto flex items-center gap-1 shrink-0">
                              <span className="text-[10px] text-[var(--text-muted)]">Rabatt:</span>
                              <input type="number" min={0} max={100} value={item.discount} onChange={(e) => updateLine(idx, 'discount', parseFloat(e.target.value) || 0)} onFocus={(e) => { try { const l = e.target.value.length; e.target.setSelectionRange(l, l); } catch {} }} className="w-10 rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-1.5 py-0.5 text-[10px] text-center text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                              <span className="text-[10px] text-[var(--text-muted)]">%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 mt-0.5 border-t border-[var(--border)]/30">
                            {!lineComplete && <span className="text-[10px] text-[var(--text-muted)]">Fyll i beskrivning och antal</span>}
                            <div className="flex-1" />
                            <button type="button" disabled={!lineComplete} onClick={() => { if (lineComplete) setOpenLines((s) => { const n = new Set(s); n.delete(idx); return n; }); }} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150', lineComplete ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-emerald-400/60 hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30 cursor-pointer' : 'border-[var(--border)]/40 text-[var(--text-muted)] opacity-35 cursor-not-allowed bg-transparent')}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                              Klar
                            </button>
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
      <div className="border-t border-[var(--border)]/40 p-2">
        <button type="button" onClick={addLine} className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:bg-[var(--surface-alt)] hover:text-[var(--accent)] transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Lägg till produkt eller tjänst
        </button>
      </div>
    </div>
  );
}

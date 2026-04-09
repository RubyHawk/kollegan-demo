'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FolderOpen, Sparkle, StackSimple } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import type { OfferProduct, ProductCategory } from '@modules/supporting/offers';
import type { CategoryNode, CategorySupportState, ProductForm } from './product-library.types';
import { buildProductForm, buildStructuredCategoryLabel, formatSek, productInitials } from './product-library.utils';

interface ProductModalProps {
  open: boolean;
  product: OfferProduct | null;
  categories: CategoryNode[];
  categoryById: Map<string, ProductCategory>;
  categorySupport: CategorySupportState;
  categorySupportMessage: string | null;
  saving: boolean;
  onClose: () => void;
  onSave: (form: ProductForm) => void;
  onOpenCategoryManager: () => void;
}

export function ProductModal({
  open,
  product,
  categories,
  categoryById,
  categorySupport,
  categorySupportMessage,
  saving,
  onClose,
  onSave,
  onOpenCategoryManager,
}: ProductModalProps) {
  const [form, setForm] = useState<ProductForm>(() => buildProductForm(product, categoryById));
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.max(el.scrollHeight, 88)}px`;
  }, [form.description, open]);

  const selectedMain = useMemo(
    () => categories.find((node) => node.main.id === form.mainCategoryId),
    [categories, form.mainCategoryId],
  );

  const previewLabel = useMemo(() => {
    if (form.categoryMode === 'custom') {
      return form.customCategory.trim() || null;
    }
    if (!form.mainCategoryId) return null;
    const mainName = categoryById.get(form.mainCategoryId)?.name ?? '';
    const subName = form.subCategoryId ? categoryById.get(form.subCategoryId)?.name : undefined;
    return buildStructuredCategoryLabel(mainName, subName);
  }, [categoryById, form.categoryMode, form.customCategory, form.mainCategoryId, form.subCategoryId]);

  const inputClass =
    'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none';
  const labelClass = 'mb-1 block text-xs font-medium text-[var(--text-secondary)]';

  const setField =
    (key: keyof ProductForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const initials = productInitials(form.name || 'NP');

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent
        mobileVariant="fullscreen"
        showMobileClose
        className="flex h-full w-[min(100vw-1rem,1080px)] flex-col sm:h-auto sm:max-h-[min(92dvh,920px)] sm:max-w-[1080px]"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-[var(--border)] px-5 pb-4 pt-5 pr-16">
            <DialogTitle className="text-base text-[var(--text-primary)]">
              {product ? 'Redigera produkt' : 'Ny produkt'}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_260px]">
            {/* ── Form ── */}
            <div className="px-5 py-4">
              <div className="space-y-4">
                {/* Name + description */}
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Namn</label>
                    <input
                      value={form.name}
                      onChange={setField('name')}
                      placeholder="Soleria SL 22 + X"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Beskrivning</label>
                    <textarea
                      ref={descriptionRef}
                      value={form.description}
                      onChange={setField('description')}
                      rows={4}
                      placeholder="Kort beskrivning av vad kunden faktiskt köper."
                      className={`${inputClass} min-h-[88px] resize-none leading-6`}
                      style={{ overflow: 'hidden' }}
                    />
                  </div>
                </div>

                {/* Price / VAT / Unit / SKU — 4-col grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="sm:col-span-1">
                    <label className={labelClass}>Pris exkl. moms</label>
                    <input
                      type="number"
                      min="0"
                      value={form.unitPrice}
                      onChange={setField('unitPrice')}
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Moms</label>
                    <select value={form.vatRate} onChange={setField('vatRate')} className={inputClass}>
                      <option value="0.25">25%</option>
                      <option value="0.12">12%</option>
                      <option value="0.06">6%</option>
                      <option value="0">0%</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Enhet</label>
                    <input
                      value={form.unit}
                      onChange={setField('unit')}
                      placeholder="st, m², tim"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>SKU</label>
                    <input
                      value={form.sku}
                      onChange={setField('sku')}
                      placeholder="SOL-001"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className={labelClass}>Bild-URL</label>
                  <input
                    value={form.imageUrl}
                    onChange={setField('imageUrl')}
                    placeholder="https://…"
                    className={inputClass}
                  />
                </div>

                {/* Category */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Kategori</span>
                    {/* Segmented toggle */}
                    <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((c) => ({ ...c, categoryMode: 'hierarchy', customCategory: '' }))
                        }
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                          form.categoryMode === 'hierarchy'
                            ? 'bg-[var(--surface-0)] text-[var(--text-primary)] shadow-sm'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                        }`}
                      >
                        <StackSimple size={11} weight="bold" />
                        Hierarki
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((c) => ({ ...c, categoryMode: 'custom', mainCategoryId: '', subCategoryId: '' }))
                        }
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                          form.categoryMode === 'custom'
                            ? 'bg-[var(--surface-0)] text-[var(--text-primary)] shadow-sm'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                        }`}
                      >
                        <Sparkle size={11} weight="bold" />
                        Fri etikett
                      </button>
                    </div>
                  </div>

                  {form.categoryMode === 'hierarchy' ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>Huvudkategori</label>
                        <select
                          value={form.mainCategoryId}
                          onChange={(e) =>
                            setForm((c) => ({ ...c, mainCategoryId: e.target.value, subCategoryId: '' }))
                          }
                          disabled={categorySupport !== 'available'}
                          className={inputClass}
                        >
                          <option value="">Välj huvudkategori</option>
                          {categories.map((node) => (
                            <option key={node.main.id} value={node.main.id}>
                              {node.main.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Underkategori</label>
                        <select
                          value={form.subCategoryId}
                          onChange={setField('subCategoryId')}
                          disabled={categorySupport !== 'available' || !selectedMain}
                          className={inputClass}
                        >
                          <option value="">{selectedMain ? 'Välj underkategori' : 'Välj huvudkategori först'}</option>
                          {selectedMain?.children.map((child) => (
                            <option key={child.id} value={child.id}>
                              {child.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {categorySupportMessage && (
                        <p className="col-span-2 text-xs text-[var(--text-muted)]">{categorySupportMessage}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className={labelClass}>Egen kategorietikett</label>
                      <input
                        value={form.customCategory}
                        onChange={setField('customCategory')}
                        placeholder="Speciallösning"
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                {/* Active toggle */}
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.checked }))}
                    className="rounded border-[var(--border)]"
                  />
                  Aktiv i offertbyggaren
                </label>
              </div>
            </div>

            {/* ── Preview sidebar ── */}
            <aside className="border-t border-[var(--border)] bg-[var(--surface-alt)] px-4 py-4 lg:border-l lg:border-t-0">
              <div className="sticky top-0 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Förhandsgranskning
                </p>

                {/* Mini product card */}
                <div className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface-0)] shadow-sm">
                  <div className="flex items-start gap-2.5 p-3">
                    {form.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.imageUrl}
                        alt={form.name}
                        className="h-8 w-8 shrink-0 rounded-lg border border-[var(--border)] object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-3)] text-[9px] font-semibold tracking-[0.12em] text-[var(--text-muted)]">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {form.name.trim() || 'Ny produkt'}
                      </p>
                      {form.description.trim() && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-muted)]">
                          {form.description.trim()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[var(--border)] px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1">
                        {previewLabel && (
                          <span className="rounded-full border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">
                            {previewLabel}
                          </span>
                        )}
                        {!form.isActive && (
                          <span className="rounded-full bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                            Inaktiv
                          </span>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          {form.unitPrice ? formatSek(Number(form.unitPrice)) : '—'}
                        </span>
                        {form.unit && (
                          <span className="ml-1 text-[10px] text-[var(--text-muted)]">/{form.unit}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manage categories link */}
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-0)] hover:text-[var(--text-secondary)]"
                >
                  <FolderOpen size={13} weight="bold" />
                  Hantera kategorier
                </button>
              </div>
            </aside>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-[var(--border)] bg-[var(--surface)] px-5 pb-5 pt-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button
              type="button"
              onClick={() => onSave(form)}
              disabled={
                saving ||
                !form.name.trim() ||
                (form.categoryMode === 'hierarchy' && !form.mainCategoryId) ||
                (form.categoryMode === 'custom' && !form.customCategory.trim())
              }
            >
              {saving ? 'Sparar…' : product ? 'Spara ändringar' : 'Skapa produkt'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

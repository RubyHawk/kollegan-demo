'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Building, FolderOpen, Layers, Sparkles } from 'lucide-react';
import type { OfferProduct, ProductCategory } from '@shared/lib/api/products.api';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ModalActionFooter,
  ModalBody,
  ModalFormGrid,
  ModalMetaCard,
  ModalSection,
} from '@shared/ui/dialog';
import type { CategoryNode, CategorySupportState, ProductForm } from './product-library.types';
import {
  buildProductForm,
  buildStructuredCategoryLabel,
  formatSek,
  productInitials,
} from './product-library.utils';

interface ProductModalProps {
  open: boolean;
  product: OfferProduct | null;
  categories: CategoryNode[];
  categoryById: Map<string, ProductCategory>;
  categorySupport: CategorySupportState;
  categorySupportMessage: string | null;
  saving: boolean;
  selectedCompanyName?: string;
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
  selectedCompanyName,
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
    el.style.height = `${Math.max(el.scrollHeight, 104)}px`;
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
    'w-full rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3.5 py-2.5 text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] transition-colors focus:border-[var(--ui-accent)] focus:outline-none';
  const labelClass = 'mb-1.5 block text-xs font-medium text-[var(--ui-text-secondary)]';
  const tabClass = (active: boolean) =>
    cn(
      'relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
      active
        ? 'bg-[var(--ui-surface)] text-[var(--ui-text)] shadow-sm ring-1 ring-inset ring-[var(--ui-border)]'
        : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-secondary)]',
    );

  const setField =
    (key: keyof ProductForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const initials = productInitials(form.name || 'NP');

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent mobileVariant="fullscreen" size="xl" showMobileClose>
        <div className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-[var(--ui-border)] pr-16">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl">
                {product ? 'Redigera produkt eller tjänst' : 'Skapa produkt eller tjänst'}
              </DialogTitle>
              {selectedCompanyName && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--ui-text-secondary)]">
                  <Building aria-hidden="true" size={12} strokeWidth={2} />
                  {selectedCompanyName}
                </span>
              )}
            </div>
            <DialogDescription className="max-w-3xl">
              Samla produktinformation, pris och kategorisering i en lugnare layout. Förhandsvisningen ligger bredvid
              som stöd i stället för att konkurrera med formuläret.
            </DialogDescription>
          </DialogHeader>

          <ModalBody className="pb-5">
            <ModalFormGrid columns="sidebar" className="items-start gap-5">
              <div className="space-y-5">
                <ModalSection tone="card">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--ui-text)]">Grundinformation</p>
                    <p className="text-sm text-[var(--ui-text-muted)]">
                      Namn, beskrivning och eventuell bild som hjälper säljaren känna igen posten i offertflödet.
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>Namn</label>
                    <input
                      value={form.name}
                      onChange={setField('name')}
                      placeholder="Soleria Silver Solfilm"
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
                      className={`${inputClass} min-h-[104px] resize-none leading-6`}
                      style={{ overflow: 'hidden' }}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Bild-URL</label>
                    <div className="flex items-start gap-3">
                      <input
                        value={form.imageUrl}
                        onChange={setField('imageUrl')}
                        placeholder="https://..."
                        className={`${inputClass} flex-1`}
                      />
                      {form.imageUrl.trim() ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.imageUrl}
                          alt=""
                          className="h-[44px] w-[44px] shrink-0 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] object-cover"
                        />
                      ) : null}
                    </div>
                  </div>
                </ModalSection>

                <ModalSection tone="card">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--ui-text)]">Pris och artikeldata</p>
                    <p className="text-sm text-[var(--ui-text-muted)]">
                      Gruppér de kommersiella uppgifterna så de går snabbare att skanna och uppdatera.
                    </p>
                  </div>

                  <ModalFormGrid columns="two">
                    <div>
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
                      <label className={labelClass}>SKU / artikelnr</label>
                      <input
                        value={form.sku}
                        onChange={setField('sku')}
                        placeholder="SOL-001"
                        className={inputClass}
                      />
                    </div>
                  </ModalFormGrid>
                </ModalSection>

                <ModalSection tone="card">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--ui-text)]">Kategori och synlighet</p>
                    <p className="text-sm text-[var(--ui-text-muted)]">
                      Välj om produkten ska följa kategorihierarkin eller bära en egen etikett i biblioteket.
                    </p>
                  </div>

                  <div className="inline-flex w-full rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-1">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={form.categoryMode === 'hierarchy'}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          categoryMode: 'hierarchy',
                          customCategory: '',
                        }))
                      }
                      className={tabClass(form.categoryMode === 'hierarchy')}
                    >
                      <Layers aria-hidden="true" size={14} strokeWidth={2} />
                      Hierarki
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={form.categoryMode === 'custom'}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          categoryMode: 'custom',
                          mainCategoryId: '',
                          subCategoryId: '',
                        }))
                      }
                      className={tabClass(form.categoryMode === 'custom')}
                    >
                      <Sparkles aria-hidden="true" size={14} strokeWidth={2} />
                      Fri etikett
                    </button>
                  </div>

                  {form.categoryMode === 'hierarchy' ? (
                    <>
                      <ModalFormGrid columns="two">
                        <div>
                          <label className={labelClass}>Huvudkategori</label>
                          <select
                            value={form.mainCategoryId}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                mainCategoryId: event.target.value,
                                subCategoryId: '',
                              }))
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
                            <option value="">
                              {selectedMain ? 'Välj underkategori' : 'Välj huvudkategori först'}
                            </option>
                            {selectedMain?.children.map((child) => (
                              <option key={child.id} value={child.id}>
                                {child.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </ModalFormGrid>

                      {categorySupportMessage ? (
                        <p className="text-sm text-[var(--ui-text-muted)]">{categorySupportMessage}</p>
                      ) : null}
                    </>
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

                  <label className="flex items-center gap-2.5 rounded-[var(--ui-radius-control)] border border-[var(--ui-border-subtle)] bg-[var(--ui-surface-subtle)] px-3.5 py-3 text-sm text-[var(--ui-text-secondary)]">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                      className="rounded border-[var(--ui-border)]"
                    />
                    Aktiv i offertbyggaren
                  </label>
                </ModalSection>
              </div>

              <div className="space-y-4 xl:sticky xl:top-0">
                <ModalMetaCard>
                  <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">
                    Förhandsgranskning
                  </p>
                  <div className="mt-3 overflow-hidden rounded-[var(--ui-radius-panel)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] shadow-sm">
                    <div className="flex items-start gap-3 border-b border-[var(--ui-border)] px-4 py-4">
                      {form.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.imageUrl}
                          alt={form.name}
                          className="h-10 w-10 shrink-0 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[10px] font-semibold text-[var(--ui-text-muted)]">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--ui-text)]">
                          {form.name.trim() || 'Ny produkt'}
                        </p>
                        {form.description.trim() ? (
                          <p className="mt-1 line-clamp-3 text-sm leading-5 text-[var(--ui-text-muted)]">
                            {form.description.trim()}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
                            Beskrivningen visas här när du börjar skriva.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 px-4 py-4 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">
                            Pris
                          </p>
                          <p className="text-lg font-semibold text-[var(--ui-text)]">
                            {form.unitPrice ? formatSek(Number(form.unitPrice)) : '—'}
                            {form.unit ? <span className="ml-1 text-sm text-[var(--ui-text-muted)]">/ {form.unit}</span> : null}
                          </p>
                        </div>
                        {!form.isActive ? (
                          <span className="rounded-full bg-[var(--ui-warning-bg)] px-2.5 py-1 text-xs font-medium text-[var(--ui-warning-text)]">
                            Inaktiv
                          </span>
                        ) : null}
                      </div>

                      {previewLabel ? (
                        <div className="rounded-[var(--ui-radius-control)] border border-[var(--ui-border-subtle)] bg-[var(--ui-surface-subtle)] px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase text-[var(--ui-text-muted)]">
                            Etikett
                          </p>
                          <p className="mt-1 text-sm text-[var(--ui-text)]">{previewLabel}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </ModalMetaCard>

                <div className="rounded-[var(--ui-radius-panel)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-4">
                  <p className="text-sm font-semibold text-[var(--ui-text)]">Behöver du ändra kategorierna?</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--ui-text-muted)]">
                    Öppna kategorihanteraren för att lägga till eller ta bort nivåer utan att lämna produktflödet.
                  </p>
                  <Button type="button" variant="outline" className="mt-3 w-full" onClick={onOpenCategoryManager}>
                    <FolderOpen aria-hidden="true" size={15} strokeWidth={2} />
                    Hantera kategorier
                  </Button>
                </div>
              </div>
            </ModalFormGrid>
          </ModalBody>

          <ModalActionFooter>
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
          </ModalActionFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

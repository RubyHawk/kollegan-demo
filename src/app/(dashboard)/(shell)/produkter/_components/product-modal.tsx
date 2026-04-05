'use client';

import { useMemo, useState } from 'react';
import { FolderOpen, Sparkle, StackSimple } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import type { OfferProduct, ProductCategory } from '@modules/supporting/offers';
import type { CategoryNode, CategorySupportState, ProductForm } from './product-library.types';
import { buildProductForm, buildStructuredCategoryLabel } from './product-library.utils';

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

function MetaCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</div>
      <div className="mt-1.5 text-sm font-medium text-[var(--text-primary)]">{value}</div>
    </div>
  );
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

  const selectedMain = useMemo(
    () => categories.find((node) => node.main.id === form.mainCategoryId),
    [categories, form.mainCategoryId],
  );

  const previewLabel = useMemo(() => {
    if (form.categoryMode === 'custom') {
      return form.customCategory.trim() || 'Ingen kategori vald';
    }

    if (!form.mainCategoryId) {
      return 'Välj huvudkategori';
    }

    const mainName = categoryById.get(form.mainCategoryId)?.name ?? '';
    const subName = form.subCategoryId ? categoryById.get(form.subCategoryId)?.name : undefined;
    return buildStructuredCategoryLabel(mainName, subName);
  }, [categoryById, form.categoryMode, form.customCategory, form.mainCategoryId, form.subCategoryId]);

  const inputClass =
    'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none';
  const labelClass = 'mb-1.5 block text-xs font-medium text-[var(--text-secondary)]';

  const setField =
    (key: keyof ProductForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent
        mobileVariant="fullscreen"
        showMobileClose
        className="w-[min(100vw-1rem,1120px)] sm:max-w-[1120px]"
      >
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="border-b border-[var(--border)] px-5 pb-4 pt-5 pr-16">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Produktredigering
            </div>
            <DialogTitle className="mt-1.5 text-xl text-[var(--text-primary)]">
              {product ? 'Redigera produkt eller tjänst' : 'Skapa produkt eller tjänst'}
            </DialogTitle>
            <DialogDescription className="mt-1.5 max-w-2xl leading-6">
              Håll formuläret kompakt nog för vardagsarbete. Säljaren ska kunna justera namn, pris och kategori utan att
              drunkna i stora block.
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-h-0 overflow-y-auto px-5 py-5">
              <div className="space-y-4">
                <section className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Namn</label>
                    <input value={form.name} onChange={setField('name')} placeholder="Soleria SL 22 + X" className={inputClass} />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Beskrivning</label>
                    <textarea
                      value={form.description}
                      onChange={setField('description')}
                      rows={3}
                      placeholder="Kort beskrivning av vad kunden faktiskt köper."
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Pris exkl. moms</label>
                    <input type="number" min="0" value={form.unitPrice} onChange={setField('unitPrice')} placeholder="0" className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass}>Momssats</label>
                    <select value={form.vatRate} onChange={setField('vatRate')} className={inputClass}>
                      <option value="0.25">25%</option>
                      <option value="0.12">12%</option>
                      <option value="0.06">6%</option>
                      <option value="0">0%</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Enhet</label>
                    <input value={form.unit} onChange={setField('unit')} placeholder="st, m², tim" className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass}>SKU / artikelnr</label>
                    <input value={form.sku} onChange={setField('sku')} placeholder="SOL-001" className={inputClass} />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Bild-URL</label>
                    <input value={form.imageUrl} onChange={setField('imageUrl')} placeholder="https://…" className={inputClass} />
                  </div>
                </section>

                <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-alt)] p-3.5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Kategorisering</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                        Välj helst huvudkategori och underkategori. Fri etikett finns kvar för specialfall och äldre poster.
                      </p>
                    </div>
                    <Button type="button" variant="outline" onClick={onOpenCategoryManager} className="h-10 self-start rounded-xl px-3">
                      <FolderOpen size={15} weight="bold" />
                      Hantera kategorier
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, categoryMode: 'hierarchy', customCategory: '' }))}
                      className={`rounded-[20px] border px-3.5 py-3.5 text-left transition-colors ${
                        form.categoryMode === 'hierarchy'
                          ? 'border-[var(--accent)] bg-[var(--accent)]/8'
                          : 'border-[var(--border)] bg-[var(--surface-0)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                        <StackSimple size={16} weight="bold" />
                        Huvudkategori + underkategori
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">
                        Bäst när biblioteket ska växa utan att bli rörigt.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          categoryMode: 'custom',
                          mainCategoryId: '',
                          subCategoryId: '',
                        }))
                      }
                      className={`rounded-[20px] border px-3.5 py-3.5 text-left transition-colors ${
                        form.categoryMode === 'custom'
                          ? 'border-[var(--accent)] bg-[var(--accent)]/8'
                          : 'border-[var(--border)] bg-[var(--surface-0)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                        <Sparkle size={16} weight="bold" />
                        Fri etikett
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">
                        Använd när produkten ännu inte passar in i den gemensamma strukturen.
                      </p>
                    </button>
                  </div>

                  {form.categoryMode === 'hierarchy' ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
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
                          <option value="">{selectedMain ? 'Välj underkategori' : 'Välj huvudkategori först'}</option>
                          {selectedMain?.children.map((child) => (
                            <option key={child.id} value={child.id}>
                              {child.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {categorySupportMessage && (
                        <div className="md:col-span-2 rounded-xl border border-dashed border-[var(--border)] px-3 py-2.5 text-sm text-[var(--text-muted)]">
                          {categorySupportMessage}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <label className={labelClass}>Egen kategorietikett</label>
                      <input
                        value={form.customCategory}
                        onChange={setField('customCategory')}
                        placeholder="Speciallösning"
                        className={inputClass}
                      />
                    </div>
                  )}
                </section>

                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-alt)] p-3.5">
                  <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                      className="rounded border-[var(--border)]"
                    />
                    Aktiv produkt i offertbyggaren
                  </label>
                </div>
              </div>
            </div>

            <aside className="border-t border-[var(--border)] bg-[var(--surface-alt)] px-5 py-5 lg:border-l lg:border-t-0">
              <div className="sticky top-0 rounded-[24px] border border-[var(--border)] bg-[var(--surface-0)] p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Förhandskänsla</p>
                <h3 className="mt-2.5 text-lg font-semibold text-[var(--text-primary)]">{form.name.trim() || 'Ny produkt'}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  {form.description.trim() || 'Beskrivningen hjälper säljaren förstå vad som faktiskt ska läggas till i offerten.'}
                </p>

                <div className="mt-4 space-y-2.5">
                  <MetaCard label="Kategori" value={previewLabel} />
                  <MetaCard label="Pris" value={form.unitPrice ? `${form.unitPrice} kr exkl. moms` : 'Sätt ett pris'} />
                  <MetaCard
                    label="Moms och enhet"
                    value={`${form.unit || 'Ingen enhet'} • ${Number(form.vatRate) * 100}%`}
                  />
                </div>
              </div>
            </aside>
          </div>

          <DialogFooter className="gap-2 border-t border-[var(--border)] px-5 pb-5 pt-3">
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

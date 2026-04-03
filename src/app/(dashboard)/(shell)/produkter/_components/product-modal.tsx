'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Sparkle, StackSimple } from '@phosphor-icons/react';
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

  if (!open) {
    return null;
  }

  const inputClass =
    'w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none';

  const labelClass = 'mb-1.5 block text-xs font-medium text-[var(--text-secondary)]';

  const setField =
    (key: keyof ProductForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.985 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative z-10 flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-[30px] border border-[var(--border)] bg-[var(--surface-0)] shadow-2xl sm:max-w-5xl sm:rounded-[32px]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Produktredigering</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
              {product ? 'Redigera produkt eller tjänst' : 'Skapa produkt eller tjänst'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
              Biblioteket ska kännas kuraterat, inte administrativt. Välj gärna kategori först så blir offertflödet lugnare och tydligare.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]"
          >
            <span className="sr-only">Stäng</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="grid flex-1 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1.2fr)_340px]">
          <div className="space-y-6 px-6 py-6">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={labelClass}>Namn</label>
                <input value={form.name} onChange={setField('name')} placeholder="Soleria SL 22 + X" className={inputClass} />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Beskrivning</label>
                <textarea
                  value={form.description}
                  onChange={setField('description')}
                  rows={4}
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

            <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-alt)] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Kategorisering</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                    Välj huvudkategori + underkategori när struktur finns. Fallback till fri etikett finns kvar för äldre eller specialfall.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="inline-flex h-10 items-center gap-2 self-start rounded-2xl border border-[var(--border)] px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                >
                  <FolderOpen size={15} weight="bold" />
                  Hantera kategorier
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, categoryMode: 'hierarchy', customCategory: '' }))}
                  className={`rounded-[24px] border px-4 py-4 text-left transition-colors ${
                    form.categoryMode === 'hierarchy'
                      ? 'border-[var(--accent)] bg-[var(--accent)]/8'
                      : 'border-[var(--border)] bg-[var(--surface-0)]'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                    <StackSimple size={16} weight="bold" />
                    Huvudkategori + underkategori
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    Bäst för ett bibliotek som ska växa och förbli lätt att navigera.
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
                  className={`rounded-[24px] border px-4 py-4 text-left transition-colors ${
                    form.categoryMode === 'custom'
                      ? 'border-[var(--accent)] bg-[var(--accent)]/8'
                      : 'border-[var(--border)] bg-[var(--surface-0)]'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                    <Sparkle size={16} weight="bold" />
                    Fri etikett
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    Använd bara när produkten inte passar in i den gemensamma strukturen ännu.
                  </p>
                </button>
              </div>

              {form.categoryMode === 'hierarchy' ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
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

                  {categorySupportMessage && (
                    <div className="md:col-span-2 rounded-2xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--text-muted)]">
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

            <label className="flex items-center gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-4 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                className="rounded border-[var(--border)]"
              />
              Aktiv produkt i offertbyggaren
            </label>
          </div>

          <aside className="border-l border-[var(--border)] bg-[var(--surface-alt)] px-6 py-6">
            <div className="rounded-[30px] border border-[var(--border)] bg-[var(--surface-0)] p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Förhandskänsla</p>
              <h3 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">{form.name.trim() || 'Ny produkt'}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                {form.description.trim() || 'Beskrivningen hjälper säljaren förstå vad som ska läggas till i offerten.'}
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">Kategori</div>
                  <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">{previewLabel}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">Pris</div>
                  <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                    {form.unitPrice ? `${form.unitPrice} kr exkl. moms` : 'Sätt ett pris'}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">Moms och enhet</div>
                  <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                    {form.unit || 'Ingen enhet'} • {Number(form.vatRate) * 100}%
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-alt)]"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={
              saving ||
              !form.name.trim() ||
              (form.categoryMode === 'hierarchy' && !form.mainCategoryId) ||
              (form.categoryMode === 'custom' && !form.customCategory.trim())
            }
            className="rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? 'Sparar…' : product ? 'Spara ändringar' : 'Skapa produkt'}
          </button>
        </footer>
      </motion.section>
    </div>
  );
}

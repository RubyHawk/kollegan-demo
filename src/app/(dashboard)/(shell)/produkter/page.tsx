'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import type { OfferProduct } from '@modules/supporting/offers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';

interface ProductForm {
  name: string;
  description: string;
  unitPrice: string;
  vatRate: string;
  unit: string;
  sku: string;
  category: string;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  unitPrice: '',
  vatRate: '0.25',
  unit: '',
  sku: '',
  category: '',
  imageUrl: '',
  isActive: true,
};

function formFromProduct(product: OfferProduct | null): ProductForm {
  if (!product) return EMPTY_FORM;

  return {
    name: product.name,
    description: product.description ?? '',
    unitPrice: String(product.unitPrice),
    vatRate: String(product.vatRate),
    unit: product.unit ?? '',
    sku: product.sku ?? '',
    category: product.category ?? '',
    imageUrl: product.imageUrl ?? '',
    isActive: product.isActive,
  };
}

function fmtSEK(value: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(value);
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase();
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const json = await response.json() as { error?: { message?: string } };
    return json.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

function ProductThumbnail({ product }: { product: OfferProduct }) {
  if (product.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.imageUrl}
        alt={product.name}
        className="h-11 w-11 shrink-0 rounded-2xl border border-[var(--border)] object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] text-xs font-semibold text-[var(--text-muted)]">
      {initials(product.name)}
    </div>
  );
}

function ProductRow({
  product,
  deleting,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  product: OfferProduct;
  deleting: boolean;
  onEdit: (product: OfferProduct) => void;
  onToggleActive: (product: OfferProduct) => void;
  onDelete: (product: OfferProduct) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn(
        'group grid gap-4 px-4 py-4 transition-colors sm:grid-cols-[minmax(0,1.5fr)_130px_auto] sm:items-center',
        'hover:bg-[var(--surface-alt)]',
        !product.isActive && 'opacity-60',
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <ProductThumbnail product={product} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{product.name}</span>
            {product.category && (
              <span className="rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
                {product.category}
              </span>
            )}
            {product.sku && (
              <span className="rounded-full bg-[var(--surface-3)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                {product.sku}
              </span>
            )}
            {!product.isActive && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                Inaktiv
              </span>
            )}
          </div>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">{product.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
        <div className="text-sm font-semibold text-[var(--text-primary)]">{fmtSEK(product.unitPrice)}</div>
        <div className="mt-0.5 text-xs text-[var(--text-muted)]">{product.unit ? `per ${product.unit}` : 'Engångspris'}</div>
      </div>

      <div className="flex items-center gap-1 self-start sm:self-center sm:justify-end">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="rounded-xl border border-transparent px-2.5 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35"
        >
          Redigera
        </button>
        <button
          type="button"
          onClick={() => onToggleActive(product)}
          className="rounded-xl border border-transparent px-2.5 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35"
        >
          {product.isActive ? 'Inaktivera' : 'Aktivera'}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() => onDelete(product)}
          className="rounded-xl border border-transparent px-2.5 py-2 text-xs font-medium text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 dark:hover:border-red-800/40 dark:hover:bg-red-900/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/25 disabled:cursor-wait disabled:opacity-50"
        >
          {deleting ? 'Tar bort…' : 'Ta bort'}
        </button>
      </div>
    </motion.div>
  );
}

function ProductModal({
  open,
  product,
  categories,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  product: OfferProduct | null;
  categories: string[];
  onClose: () => void;
  onSave: (form: ProductForm) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<ProductForm>(() => formFromProduct(product));

  if (!open) return null;

  const inputCls = 'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none';
  const labelCls = 'mb-1 block text-xs font-medium text-[var(--text-secondary)]';

  const set =
    (key: keyof ProductForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative z-10 max-h-[90dvh] w-full overflow-y-auto border border-[var(--border)] bg-[var(--surface-0)] shadow-2xl sm:max-w-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {product ? 'Redigera produkt' : 'Skapa produkt'}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Håll produktbiblioteket tydligt och konsekvent för offertbyggaren.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Namn</label>
              <input value={form.name} onChange={set('name')} placeholder="Systemutveckling" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Pris exkl. moms</label>
              <input type="number" min="0" value={form.unitPrice} onChange={set('unitPrice')} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Enhet</label>
              <input value={form.unit} onChange={set('unit')} placeholder="tim, st, mån" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Kategori</label>
              <input
                value={form.category}
                onChange={set('category')}
                list="product-category-suggestions"
                placeholder="Konsulttjänster"
                className={inputCls}
              />
              <datalist id="product-category-suggestions">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>SKU / artikelnr</label>
              <input value={form.sku} onChange={set('sku')} placeholder="KON-001" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Momssats</label>
              <select value={form.vatRate} onChange={set('vatRate')} className={inputCls}>
                <option value="0.25">25%</option>
                <option value="0.12">12%</option>
                <option value="0.06">6%</option>
                <option value="0">0%</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Bild-URL</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={set('imageUrl')}
                placeholder="https://example.com/bild.png"
                className={inputCls}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Beskrivning</label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={4}
                placeholder="Kort beskrivning av produkten eller tjänsten."
                className={cn(inputCls, 'resize-none')}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-3 text-sm text-[var(--text-secondary)]">
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              className="rounded border-[var(--border)]"
            />
            Aktiv produkt i offertbyggaren
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-alt)]"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim()}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:pointer-events-none disabled:opacity-50 shadow-[0_12px_24px_rgba(0,0,0,0.12)]"
            style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, #e06b45 80%), color-mix(in srgb, var(--accent) 8%, #a34729 92%))' }}
          >
            {saving ? 'Sparar…' : product ? 'Spara ändringar' : 'Skapa produkt'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<OfferProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<OfferProduct | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<OfferProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch('/api/offers/products');
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Kunde inte hämta produkter'));
      }
      const json = await response.json() as { data: { products: OfferProduct[] } };
      setAllProducts(json.data.products);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const product of allProducts) {
      if (product.category) seen.add(product.category);
    }
    return [...seen].sort((a, b) => a.localeCompare(b, 'sv'));
  }, [allProducts]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allProducts.filter((product) => {
      if (!showInactive && !product.isActive) return false;
      if (catFilter === '__none' && product.category) return false;
      if (catFilter && catFilter !== '__none' && product.category !== catFilter) return false;
      if (!query) return true;

      const haystack = [
        product.name,
        product.description,
        product.sku,
        product.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [allProducts, search, catFilter, showInactive]);

  const catCounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const counts: Record<string, number> = {};

    for (const product of allProducts) {
      if (!showInactive && !product.isActive) continue;
      if (query) {
        const haystack = [
          product.name,
          product.description,
          product.sku,
          product.category,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) continue;
      }

      const key = product.category ?? '';
      counts[key] = (counts[key] ?? 0) + 1;
    }

    return counts;
  }, [allProducts, search, showInactive]);

  const totalVisible = useMemo(
    () => Object.values(catCounts).reduce((sum, count) => sum + count, 0),
    [catCounts],
  );

  const openCreate = () => {
    setEditProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product: OfferProduct) => {
    setEditProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditProduct(null);
  };

  const handleSave = useCallback(async (form: ProductForm) => {
    setSaving(true);
    setError(null);

    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        unitPrice: parseFloat(form.unitPrice) || 0,
        vatRate: parseFloat(form.vatRate) || 0.25,
        unit: form.unit.trim() || undefined,
        sku: form.sku.trim() || undefined,
        category: form.category.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        isActive: form.isActive,
      };

      const response = editProduct
        ? await fetch(`/api/offers/products/${editProduct.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/offers/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Kunde inte spara produkten'));
      }

      closeModal();
      await loadProducts();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [editProduct, loadProducts]);

  const handleToggleActive = useCallback(async (product: OfferProduct) => {
    setError(null);

    try {
      const response = await fetch(`/api/offers/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Kunde inte uppdatera produkten'));
      }

      setAllProducts((current) =>
        current.map((item) =>
          item.id === product.id ? { ...item, isActive: !item.isActive } : item,
        ),
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const handleDelete = useCallback(async (product: OfferProduct) => {
    setDeletingId(product.id);
    setError(null);

    try {
      const response = await fetch(`/api/offers/products/${product.id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Kunde inte ta bort produkten'));
      }

      setAllProducts((current) => current.filter((item) => item.id !== product.id));
      setDeleteProduct(null);
      if (editProduct?.id === product.id) closeModal();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  }, [editProduct]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="space-y-6"
      >
        <div className="flex flex-col gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)] p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Produktbibliotek</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Produkter och tjänster</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
              Håll biblioteket lätt att överblicka så att offertskapandet känns snabbt, tryggt och konsekvent.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              {totalVisible} synliga produkter
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="rounded-2xl px-4 py-2.5 text-sm font-medium text-white transition-all hover:translate-y-[-1px] hover:opacity-95 shadow-[0_14px_28px_rgba(0,0,0,0.14)]"
              style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, #e06b45 80%), color-mix(in srgb, var(--accent) 8%, #a34729 92%))' }}
            >
              Ny produkt
            </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.03, ease: 'easeOut' }}
            className="h-fit rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)] p-4 shadow-sm xl:sticky xl:top-6"
          >
            <div className="mb-4">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Filter</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Växla snabbt mellan kategorier och status.</p>
            </div>

            <div className="space-y-3">
              <label className="relative block">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Sök produkt eller kategori"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-sm text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-sm text-[var(--text-secondary)]">
                Visa inaktiva
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(event) => setShowInactive(event.target.checked)}
                  className="rounded border-[var(--border)]"
                />
              </label>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Kategorier</p>
              <div className="space-y-1.5">
                {[
                  { key: '', label: 'Alla produkter', count: totalVisible },
                  ...categories.map((category) => ({
                    key: category,
                    label: category,
                    count: catCounts[category] ?? 0,
                  })),
                  ...((catCounts[''] ?? 0) > 0 ? [{ key: '__none', label: 'Okategoriserade', count: catCounts[''] }] : []),
                ].map((item) => {
                  const active = catFilter === item.key || (!catFilter && item.key === '');
                  return (
                    <button
                      key={item.key || 'all'}
                      type="button"
                      onClick={() => setCatFilter(item.key)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-colors',
                        active
                          ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]',
                      )}
                    >
                      <span className="truncate">{item.label}</span>
                      <span
                        className={cn(
                          'ml-3 rounded-full px-2 py-0.5 text-xs font-medium',
                          active
                            ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                            : 'bg-[var(--surface-3)] text-[var(--text-muted)]',
                        )}
                      >
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.aside>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.05, ease: 'easeOut' }}
            className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)] shadow-sm"
          >
            <div className="border-b border-[var(--border)] px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-[var(--text-primary)]">Bibliotek</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {search || catFilter
                      ? 'Filtrerad vy av produkter som matchar det du letar efter.'
                      : 'Alla produkter som kan användas i offerter.'}
                  </p>
                </div>
                {(search || catFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setCatFilter('');
                    }}
                    className="self-start rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-alt)] sm:self-auto"
                  >
                    Rensa filter
                  </button>
                )}
              </div>
            </div>

            <div className="min-h-[420px] px-4 py-4 sm:px-5">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="h-20 animate-pulse rounded-3xl bg-[var(--surface-alt)]" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-6 text-center"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--surface-3)] text-[var(--text-muted)]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-[var(--text-primary)]">
                    {search || catFilter ? 'Inga produkter matchar filtret' : 'Inga produkter ännu'}
                  </p>
                  <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">
                    {search || catFilter
                      ? 'Prova att rensa filtret eller sök bredare för att hitta rätt produkt.'
                      : 'Lägg till de vanligaste tjänsterna först så blir offertskapandet snabbare för hela teamet.'}
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {(search || catFilter) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch('');
                          setCatFilter('');
                        }}
                        className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)]"
                      >
                        Rensa filter
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={openCreate}
                      className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-95 shadow-[0_12px_24px_rgba(0,0,0,0.12)]"
                      style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, #e06b45 80%), color-mix(in srgb, var(--accent) 8%, #a34729 92%))' }}
                    >
                      Ny produkt
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div layout className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)]">
                  <AnimatePresence initial={false}>
                    {filtered.map((product) => (
                      <div key={product.id} className="border-b border-[var(--border)] last:border-b-0">
                        <ProductRow
                          product={product}
                          deleting={deletingId === product.id}
                          onEdit={openEdit}
                          onToggleActive={handleToggleActive}
                          onDelete={setDeleteProduct}
                        />
                      </div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </motion.section>
        </div>
      </motion.div>

      {modalOpen && (
        <ProductModal
          key={editProduct?.id ?? 'new-product'}
          open={modalOpen}
          product={editProduct}
          categories={categories}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
        />
      )}

      <Dialog open={Boolean(deleteProduct)} onOpenChange={(open) => { if (!open) setDeleteProduct(null); }}>
        <DialogContent mobileVariant="sheet" showMobileClose className="max-w-lg">
          <DialogHeader className="px-6 pt-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </div>
            <DialogTitle>Ta bort produkt?</DialogTitle>
            <DialogDescription>
              Produkten försvinner från biblioteket och kan inte återställas automatiskt.
            </DialogDescription>
          </DialogHeader>

          {deleteProduct && (
            <div className="mx-6 rounded-3xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{deleteProduct.name}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                {deleteProduct.category && <span className="rounded-full bg-[var(--surface-3)] px-2 py-1">{deleteProduct.category}</span>}
                <span className="rounded-full bg-[var(--surface-3)] px-2 py-1">{fmtSEK(deleteProduct.unitPrice)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 px-6 pb-6 pt-4">
            <button
              type="button"
              onClick={() => setDeleteProduct(null)}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-alt)]"
            >
              Avbryt
            </button>
            <button
              type="button"
              disabled={!deleteProduct || deletingId === deleteProduct.id}
              onClick={() => {
                if (deleteProduct) void handleDelete(deleteProduct);
              }}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50"
            >
              {deleteProduct && deletingId === deleteProduct.id ? 'Tar bort…' : 'Ta bort'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

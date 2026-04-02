'use client';

/**
 * /products — Product Library
 *
 * Lists all reusable products/services grouped by category.
 * Supports search, category filter, active/inactive toggle, inline create/edit.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProductForm {
  name:        string;
  description: string;
  unitPrice:   string;
  vatRate:     string;
  unit:        string;
  sku:         string;
  category:    string;
  imageUrl:    string;
  isActive:    boolean;
}

const EMPTY_FORM: ProductForm = {
  name: '', description: '', unitPrice: '', vatRate: '0.25',
  unit: '', sku: '', category: '', imageUrl: '', isActive: true,
};

function formFromProduct(product: OfferProduct | null): ProductForm {
  if (!product) return EMPTY_FORM;

  return {
    name:        product.name,
    description: product.description ?? '',
    unitPrice:   String(product.unitPrice),
    vatRate:     String(product.vatRate),
    unit:        product.unit ?? '',
    sku:         product.sku ?? '',
    category:    product.category ?? '',
    imageUrl:    product.imageUrl ?? '',
    isActive:    product.isActive,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(n);
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase();
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function ProductThumbnail({ product }: { product: OfferProduct }) {
  if (product.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[var(--border)]"
      />
    );
  }
  return (
    <div className="w-12 h-12 rounded-lg shrink-0 bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--text-muted)]">
      {initials(product.name)}
    </div>
  );
}

function ProductRow({
  product,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  product: OfferProduct;
  onEdit: (p: OfferProduct) => void;
  onToggleActive: (p: OfferProduct) => void;
  onDelete: (p: OfferProduct) => void;
}) {
  return (
    <div className={cn(
      'flex items-center gap-4 px-4 py-3 hover:bg-[var(--surface-alt)] transition-colors',
      !product.isActive && 'opacity-50',
    )}>
      <ProductThumbnail product={product} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">{product.name}</span>
          {product.sku && (
            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--surface-3)] px-1.5 py-0.5 rounded font-mono">
              {product.sku}
            </span>
          )}
          {!product.isActive && (
            <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
              Inaktiv
            </span>
          )}
        </div>
        {product.description && (
          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{product.description}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold text-[var(--text-primary)]">{fmtSEK(product.unitPrice)}</div>
        {product.unit && <div className="text-[10px] text-[var(--text-muted)]">per {product.unit}</div>}
      </div>
      <div className="shrink-0 flex items-center gap-1">
        <button
          onClick={() => onEdit(product)}
          className="p-1.5 rounded hover:bg-[var(--surface-active)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          title="Redigera"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          onClick={() => onToggleActive(product)}
          className="p-1.5 rounded hover:bg-[var(--surface-active)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          title={product.isActive ? 'Inaktivera' : 'Aktivera'}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {product.isActive
              ? <><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></>
              : <><path d="M12 2v10"/><path d="M5.64 5.64a9 9 0 1 0 12.73 12.73A9 9 0 0 0 5.64 5.64z"/></>
            }
          </svg>
        </button>
        <button
          onClick={() => onDelete(product)}
          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-600 transition-colors"
          title="Ta bort"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Product Form Modal ────────────────────────────────────────────────────────

function ProductModal({
  open,
  product,
  categories,
  onClose,
  onSave,
  saving,
}: {
  open:       boolean;
  product:    OfferProduct | null;
  categories: string[];
  onClose:    () => void;
  onSave:     (form: ProductForm) => void;
  saving:     boolean;
}) {
  const [form, setForm] = useState<ProductForm>(() => formFromProduct(product));

  if (!open) return null;

  const set = (k: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors';
  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg bg-[var(--surface-0)] sm:rounded-2xl shadow-xl border border-[var(--border)] overflow-y-auto max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {product ? 'Redigera produkt' : 'Ny produkt'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--surface-active)] text-[var(--text-muted)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className={labelCls}>Namn *</label>
            <input value={form.name} onChange={set('name')} placeholder="Systemutveckling" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Pris (SEK, ex moms)</label>
              <input type="number" min="0" value={form.unitPrice} onChange={set('unitPrice')} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Enhet</label>
              <input value={form.unit} onChange={set('unit')} placeholder="tim, st, mån…" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Kategori</label>
              <input
                value={form.category}
                onChange={set('category')}
                list="category-suggestions"
                placeholder="Konsulttjänster"
                className={inputCls}
              />
              <datalist id="category-suggestions">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>SKU / Artikelnr</label>
              <input value={form.sku} onChange={set('sku')} placeholder="KON-001" className={inputCls} />
            </div>
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
            <label className={labelCls}>Beskrivning</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="Kort beskrivning av produkten eller tjänsten…"
              className={cn(inputCls, 'resize-none')}
            />
          </div>

          <div>
            <label className={labelCls}>Bild-URL (valfri)</label>
            <div className="flex items-center gap-2">
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[var(--border)]" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              )}
              <input
                type="url"
                value={form.imageUrl}
                onChange={set('imageUrl')}
                placeholder="https://example.com/bild.png"
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-[var(--border)]"
            />
            <label htmlFor="isActive" className="text-sm text-[var(--text-secondary)]">Aktiv (visas i offertbyggaren)</label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] transition-colors">
            Avbryt
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-light)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? 'Sparar…' : product ? 'Spara ändringar' : 'Skapa produkt'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products,    setProducts]    = useState<OfferProduct[]>([]);
  const [categories,  setCategories]  = useState<string[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const [searchInput,  setSearchInput]  = useState('');
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editProduct,  setEditProduct]  = useState<OfferProduct | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<OfferProduct | null>(null);
  const [saving,       setSaving]       = useState(false);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load ────────────────────────────────────────────────────────────────────

  const loadProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (!showInactive) params.set('isActive', 'true');
      const res = await fetch(`/api/offers/products?${params}`);
      if (!res.ok) throw new Error('Kunde inte hämta produkter');
      const json = await res.json() as { data: { products: OfferProduct[] } };
      setProducts(json.data.products);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, showInactive]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/offers/products/categories');
      if (!res.ok) return;
      const json = await res.json() as { data: { categories: string[] } };
      setCategories(json.data.categories);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { void loadProducts(); }, [loadProducts]);
  useEffect(() => { void loadCategories(); }, [loadCategories]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const grouped = useMemo(() => {
    const filtered = catFilter
      ? products.filter((p) => p.category === catFilter)
      : products;

    const map = new Map<string, OfferProduct[]>();
    for (const p of filtered) {
      const key = p.category ?? '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }

    // Sort: named categories first (alphabetical), then uncategorized
    const entries = [...map.entries()].sort(([a], [b]) => {
      if (!a && b)  return 1;
      if (a && !b)  return -1;
      return a.localeCompare(b, 'sv');
    });

    return entries;
  }, [products, catFilter]);

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const openCreate = () => { setEditProduct(null); setModalOpen(true); };
  const openEdit   = (p: OfferProduct) => { setEditProduct(p); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditProduct(null); };

  const handleSave = useCallback(async (form: ProductForm) => {
    setSaving(true);
    try {
      const body = {
        name:        form.name.trim(),
        description: form.description.trim() || undefined,
        unitPrice:   parseFloat(form.unitPrice) || 0,
        vatRate:     parseFloat(form.vatRate) || 0.25,
        unit:        form.unit.trim() || undefined,
        sku:         form.sku.trim() || undefined,
        category:    form.category.trim() || undefined,
        imageUrl:    form.imageUrl.trim() || undefined,
        isActive:    form.isActive,
      };

      const res = editProduct
        ? await fetch(`/api/offers/products/${editProduct.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          })
        : await fetch('/api/offers/products', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          });

      if (!res.ok) throw new Error('Kunde inte spara produkten');
      closeModal();
      void loadProducts();
      void loadCategories();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [editProduct, loadProducts, loadCategories]);

  const handleToggleActive = useCallback(async (p: OfferProduct) => {
    await fetch(`/api/offers/products/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    void loadProducts();
  }, [loadProducts]);

  const handleDelete = useCallback(async (p: OfferProduct) => {
    await fetch(`/api/offers/products/${p.id}`, { method: 'DELETE' });
    setDeleteProduct(null);
    void loadProducts();
    void loadCategories();
  }, [loadProducts, loadCategories]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--surface-0)] px-6 py-4">
        <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
          <div>
            <h1 className="text-base font-semibold text-[var(--text-primary)]">Produktbibliotek</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {products.length} {products.length === 1 ? 'produkt' : 'produkter'} totalt
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-light)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Ny produkt
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-[var(--border)] bg-[var(--surface-0)] px-6 py-2.5">
        <div className="flex items-center gap-3 max-w-5xl mx-auto flex-wrap">
          {/* Search */}
          <div className="relative">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={searchInput}
              onChange={(e) => {
                const v = e.target.value;
                setSearchInput(v);
                if (searchDebounce.current) clearTimeout(searchDebounce.current);
                searchDebounce.current = setTimeout(() => setSearch(v), 300);
              }}
              placeholder="Sök produkt…"
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors w-48"
            />
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            >
              <option value="">Alla kategorier</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          {/* Active toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <span className="text-xs text-[var(--text-secondary)]">Visa inaktiva</span>
          </label>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-[var(--surface-alt)] animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-3)] flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--text-muted)]">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Inga produkter hittades</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Skapa din första produkt för att börja</p>
            <button
              onClick={openCreate}
              className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-light)] transition-colors"
            >
              + Ny produkt
            </button>
          </div>
        )}

        {!loading && grouped.map(([category, items]) => (
          <div key={category || '__none'} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {category || 'Okategoriserade'}
              </h2>
              <span className="text-xs text-[var(--text-muted)]">{items.length} {items.length === 1 ? 'produkt' : 'produkter'}</span>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] divide-y divide-[var(--border)] overflow-hidden">
              {items.map((p) => (
                <ProductRow
                  key={p.id}
                    product={p}
                    onEdit={openEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={setDeleteProduct}
                  />
              ))}
            </div>
          </div>
        ))}
      </div>

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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ta bort produkt?</DialogTitle>
            <DialogDescription>
              Produkten tas bort från biblioteket och kan inte återställas automatiskt.
            </DialogDescription>
          </DialogHeader>

          {deleteProduct && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <p className="font-medium text-[var(--text-primary)]">{deleteProduct.name}</p>
              {deleteProduct.category && <p className="mt-1">Kategori: {deleteProduct.category}</p>}
            </div>
          )}

          <DialogFooter className="mt-2">
            <button
              type="button"
              onClick={() => setDeleteProduct(null)}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-alt)]"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={() => { if (deleteProduct) void handleDelete(deleteProduct); }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Ta bort
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

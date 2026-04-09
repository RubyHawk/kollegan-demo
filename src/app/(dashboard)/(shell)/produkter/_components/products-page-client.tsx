'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowsClockwise,
  FolderOpen,
  Folders,
  MagnifyingGlass,
  Plus,
  Sparkle,
} from '@phosphor-icons/react';
import type { OfferProduct, ProductCategory } from '@modules/supporting/offers';
import { Button } from '@shared/ui/button';
import { useActiveCompany } from '@shared/hooks/use-active-company';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { fetchWithRefresh } from '@shared/lib/api-client';
import { cn } from '@shared/lib/utils';
import { CategoryManagerDialog } from './category-manager-dialog';
import { ProductModal } from './product-modal';
import { ProductRow } from './product-row';
import type {
  CategoryComposerPayload,
  ProductCategoryMeta,
  ProductForm,
  CategorySupportState,
} from './product-library.types';
import {
  buildCategoryTree,
  buildStructuredCategoryLabel,
  formatSek,
  getProductCategoryMeta,
  normalizeSearch,
  readApiError,
} from './product-library.utils';

type ProductEnvelope = { data: { products: OfferProduct[] } };
type CategoryEnvelope = { data: { categories: ProductCategory[] } };
type CategoryFilterKey = '' | 'uncategorized' | `main:${string}` | `sub:${string}` | `legacy:${string}`;

export function ProductsPageClient() {
  const {
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
    loading: companyLoading,
    error: companyError,
  } = useActiveCompany();
  const [products, setProducts] = useState<OfferProduct[]>([]);
  const [rawCategories, setRawCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterKey>('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<OfferProduct | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<OfferProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categorySupport, setCategorySupport] = useState<CategorySupportState>('available');
  const [categorySupportMessage, setCategorySupportMessage] = useState<string | null>(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedCompanyId) params.set('companyId', selectedCompanyId);
    const response = await fetchWithRefresh(`/api/offers/products${params.toString() ? `?${params.toString()}` : ''}`);
    if (!response.ok) {
      throw new Error(await readApiError(response, 'Kunde inte hämta produkter'));
    }

    const json = await response.json() as ProductEnvelope;
    setProducts(json.data.products);
  }, [selectedCompanyId]);

  const loadCategories = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedCompanyId) params.set('companyId', selectedCompanyId);
    const response = await fetchWithRefresh(`/api/offers/products/categories${params.toString() ? `?${params.toString()}` : ''}`);
    if (response.status === 503) {
      setCategorySupport('unavailable');
      setCategorySupportMessage(await readApiError(response, 'Produktkategorier är inte redo ännu.'));
      setRawCategories([]);
      return;
    }

    if (!response.ok) {
      throw new Error(await readApiError(response, 'Kunde inte hämta kategorier'));
    }

    const json = await response.json() as CategoryEnvelope;
    setCategorySupport('available');
    setCategorySupportMessage(null);
    setRawCategories(json.data.categories);
  }, [selectedCompanyId]);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadProducts(), loadCategories()]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [loadCategories, loadProducts]);

  useEffect(() => {
    void reloadAll();
  }, [reloadAll]);

  const categoryTree = useMemo(() => buildCategoryTree(rawCategories), [rawCategories]);

  const categoryById = useMemo(() => {
    const map = new Map<string, ProductCategory>();
    for (const category of rawCategories) {
      map.set(category.id, category);
    }
    return map;
  }, [rawCategories]);

  const productMetas = useMemo(() => {
    const map = new Map<string, ProductCategoryMeta>();
    for (const product of products) {
      map.set(product.id, getProductCategoryMeta(product, categoryById));
    }
    return map;
  }, [categoryById, products]);

  const searchableProducts = useMemo(() => {
    return products.map((product) => {
      const meta = productMetas.get(product.id);
      const haystack = normalizeSearch(
        [
          product.name,
          product.description,
          product.sku,
          product.unit,
          meta?.label,
          meta?.mainCategoryName,
          meta?.subCategoryName,
        ]
          .filter(Boolean)
          .join(' '),
      );

      return { product, meta, haystack };
    });
  }, [productMetas, products]);

  const mainCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { meta } of searchableProducts) {
      if (meta?.mainCategoryId) {
        counts.set(meta.mainCategoryId, (counts.get(meta.mainCategoryId) ?? 0) + 1);
      }
    }
    return counts;
  }, [searchableProducts]);

  const subCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { meta } of searchableProducts) {
      if (meta?.subCategoryId) {
        counts.set(meta.subCategoryId, (counts.get(meta.subCategoryId) ?? 0) + 1);
      }
    }
    return counts;
  }, [searchableProducts]);

  const legacyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { meta } of searchableProducts) {
      if (!meta?.isStructured && meta?.label) {
        counts.set(meta.label, (counts.get(meta.label) ?? 0) + 1);
      }
    }
    return counts;
  }, [searchableProducts]);

  const legacyCategoryLabels = useMemo(
    () => [...legacyCounts.keys()].sort((left, right) => left.localeCompare(right, 'sv')),
    [legacyCounts],
  );

  const filteredProducts = useMemo(() => {
    const query = normalizeSearch(search);

    return searchableProducts
      .filter(({ product, haystack, meta }) => {
        if (!showInactive && !product.isActive) {
          return false;
        }

        if (query && !haystack.includes(query)) {
          return false;
        }

        if (!categoryFilter) {
          return true;
        }

        if (categoryFilter === 'uncategorized') {
          return !meta?.label;
        }

        if (categoryFilter.startsWith('main:')) {
          return meta?.mainCategoryId === categoryFilter.slice(5);
        }

        if (categoryFilter.startsWith('sub:')) {
          return meta?.subCategoryId === categoryFilter.slice(4);
        }

        if (categoryFilter.startsWith('legacy:')) {
          return meta?.label === categoryFilter.slice(7) && !meta.isStructured;
        }

        return true;
      })
      .map(({ product }) => product);
  }, [categoryFilter, search, searchableProducts, showInactive]);

  const totalVisible = filteredProducts.length;
  const activeCount = products.filter((product) => product.isActive).length;
  const uncategorizedCount = products.filter((product) => !productMetas.get(product.id)?.label).length;

  const openCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product: OfferProduct) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleCreateCategory = useCallback(async (payload: CategoryComposerPayload) => {
    setCategorySaving(true);
    setError(null);
    try {
      const response = await fetchWithRefresh('/api/offers/products/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          companyId: selectedCompanyId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Kunde inte skapa kategori'));
      }

      await loadCategories();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCategorySaving(false);
    }
  }, [loadCategories, selectedCompanyId]);

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    setDeletingCategoryId(categoryId);
    setError(null);
    try {
      const response = await fetchWithRefresh(`/api/offers/products/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Kunde inte ta bort kategorin'));
      }

      await Promise.all([loadProducts(), loadCategories()]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingCategoryId(null);
    }
  }, [loadCategories, loadProducts]);

  const handleSave = useCallback(async (form: ProductForm) => {
    setSaving(true);
    setError(null);
    try {
      const selectedMain = form.mainCategoryId ? categoryById.get(form.mainCategoryId) : undefined;
      const selectedSub = form.subCategoryId ? categoryById.get(form.subCategoryId) : undefined;
      const structuredLabel = selectedMain
        ? buildStructuredCategoryLabel(selectedMain.name, selectedSub?.name)
        : undefined;

      const payload = {
        name: form.name.trim(),
        companyId: selectedCompanyId || undefined,
        description: form.description.trim() || undefined,
        unitPrice: parseFloat(form.unitPrice) || 0,
        vatRate: parseFloat(form.vatRate) || 0.25,
        unit: form.unit.trim() || undefined,
        sku: form.sku.trim() || undefined,
        category:
          form.categoryMode === 'custom'
            ? form.customCategory.trim() || undefined
            : structuredLabel,
        categoryId:
          form.categoryMode === 'hierarchy'
            ? form.subCategoryId || form.mainCategoryId || undefined
            : null,
        imageUrl: form.imageUrl.trim() || undefined,
        isActive: form.isActive,
      };

      const response = await fetchWithRefresh(
        editingProduct ? `/api/offers/products/${editingProduct.id}` : '/api/offers/products',
        {
          method: editingProduct ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Kunde inte spara produkten'));
      }

      closeModal();
      await loadProducts();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [categoryById, editingProduct, loadProducts, selectedCompanyId]);

  const handleToggleActive = useCallback(async (product: OfferProduct) => {
    setError(null);
    try {
      const response = await fetchWithRefresh(`/api/offers/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive, companyId: selectedCompanyId || undefined }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Kunde inte uppdatera produkten'));
      }

      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, isActive: !item.isActive } : item)),
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }, [selectedCompanyId]);

  const handleDeleteProduct = useCallback(async (product: OfferProduct) => {
    setDeletingId(product.id);
    setError(null);
    try {
      const response = await fetchWithRefresh(`/api/offers/products/${product.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Kunde inte ta bort produkten'));
      }

      setProducts((current) => current.filter((item) => item.id !== product.id));
      setDeleteProduct(null);
      if (editingProduct?.id === product.id) {
        closeModal();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  }, [editingProduct]);

  const activeMainFilterId = categoryFilter.startsWith('main:') ? categoryFilter.slice(5) : '';
  const hasActiveFilters = Boolean(search || categoryFilter || showInactive);

  const filterPanel = (
    <div className="space-y-4">
      <label className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-3 text-sm text-[var(--text-secondary)]">
        Visa inaktiva
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(event) => setShowInactive(event.target.checked)}
          className="rounded border-[var(--border)]"
        />
      </label>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Snabbfilter</p>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter('')}
            className={cn(
              'flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-colors',
              !categoryFilter ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)]',
            )}
          >
            <span>Alla produkter</span>
            <span className="rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-xs">{products.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('uncategorized')}
            className={cn(
              'flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-colors',
              categoryFilter === 'uncategorized' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)]',
            )}
          >
            <span>Okategoriserade</span>
            <span className="rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-xs">{uncategorizedCount}</span>
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Hierarki</p>
          <button
            type="button"
            onClick={() => setCategoryManagerOpen(true)}
            className="text-xs font-medium text-[var(--accent)]"
          >
            Hantera
          </button>
        </div>
        <div className="space-y-2">
          {categoryTree.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--text-muted)]">
              {categorySupport === 'available'
                ? 'Skapa första huvudkategorin för att börja strukturera biblioteket.'
                : categorySupportMessage ?? 'Kategorier aktiveras när databasen är uppdaterad.'}
            </div>
          ) : (
            categoryTree.map((node) => (
              <div key={node.main.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-alt)] p-2">
                <button
                  type="button"
                  onClick={() => setCategoryFilter(`main:${node.main.id}`)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-colors',
                    activeMainFilterId === node.main.id ? 'bg-[var(--surface-0)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]',
                  )}
                >
                  <span className="font-medium">{node.main.name}</span>
                  <span className="rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-xs">
                    {mainCounts.get(node.main.id) ?? 0}
                  </span>
                </button>
                {node.children.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-2 px-2 pb-2">
                    {node.children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => setCategoryFilter(`sub:${child.id}`)}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs transition-colors',
                          categoryFilter === `sub:${child.id}`
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-[var(--surface-0)] text-[var(--text-secondary)] hover:bg-[var(--surface)]',
                        )}
                      >
                        {child.name} • {subCounts.get(child.id) ?? 0}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {legacyCategoryLabels.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Äldre fria etiketter</p>
          <div className="flex flex-wrap gap-2">
            {legacyCategoryLabels.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setCategoryFilter(`legacy:${label}`)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  categoryFilter === `legacy:${label}`
                    ? 'border-[var(--accent)] bg-[var(--accent)]/8 text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)]',
                )}
              >
                {label} • {legacyCounts.get(label) ?? 0}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <h1 className="text-base font-semibold text-[var(--text-primary)]">Produktbibliotek</h1>
            <div className="flex flex-wrap items-center gap-1">
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                {products.length} produkter
              </span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                {activeCount} aktiva
              </span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                {totalVisible} visas
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {companies.length > 1 && (
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="h-9 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            {companyLoading && (
              <span className="text-xs text-[var(--text-muted)]">Laddar…</span>
            )}
            {companyError && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                {companyError}
              </span>
            )}
            <Button type="button" variant="outline" onClick={() => setCategoryManagerOpen(true)} className="h-9 rounded-xl px-3">
              <Folders size={15} weight="bold" />
              <span className="hidden sm:inline">Hantera kategorier</span>
            </Button>
            <Button type="button" onClick={openCreate} className="h-9 rounded-xl px-3">
              <Plus size={15} weight="bold" />
              Ny produkt
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden h-fit rounded-[26px] border border-[var(--border)] bg-[var(--surface-0)] p-4 shadow-sm xl:block xl:sticky xl:top-6">
            <div className="mb-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Filter</p>
            </div>
            {filterPanel}
          </aside>

          <section className="order-1 overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface-0)] shadow-sm xl:order-2">
            <div className="border-b border-[var(--border)] px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-base font-semibold text-[var(--text-primary)]">Bibliotek</p>
                <div className="flex flex-wrap gap-2">
                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSearch('');
                        setCategoryFilter('');
                        setShowInactive(false);
                      }}
                      className="h-10 rounded-xl px-3.5"
                    >
                      <ArrowsClockwise size={16} weight="bold" />
                      Rensa
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={() => void reloadAll()} className="h-10 rounded-xl px-3.5">
                    <ArrowsClockwise size={16} weight="bold" />
                    Ladda om
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 lg:flex-row">
                <label className="relative block flex-1">
                  <MagnifyingGlass size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Sök namn, beskrivning, SKU, enhet eller kategori"
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFiltersOpen((current) => !current)}
                  className="rounded-2xl xl:hidden"
                >
                  {filtersOpen ? 'Dölj filter' : 'Visa filter'}
                </Button>
              </div>

              <AnimatePresence initial={false}>
                {filtersOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="overflow-hidden xl:hidden"
                  >
                    <div className="mt-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface-alt)] p-4">
                      {filterPanel}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="min-h-[420px]">
              {loading ? (
                <div>
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-14 animate-pulse border-b border-[var(--border)] last:border-b-0" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                  <motion.div initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} className="flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-6 m-4 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--surface-0)] text-[var(--text-muted)]">
                    {hasActiveFilters ? <Sparkle size={24} weight="duotone" /> : <FolderOpen size={24} weight="duotone" />}
                  </div>
                  <p className="text-base font-semibold text-[var(--text-primary)]">
                    {hasActiveFilters ? 'Ingen produkt matchar filtret' : 'Produktbiblioteket är tomt'}
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-7 text-[var(--text-muted)]">
                    {hasActiveFilters
                      ? 'Prova att rensa filtren eller sök bredare för att hitta rätt post.'
                      : 'Börja med de vanligaste tjänsterna och ge dem en tydlig struktur så att offertsidan känns självklar för alla som jobbar i den.'}
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <Button type="button" onClick={openCreate} className="h-10 rounded-xl px-3.5">
                      <Plus size={16} weight="bold" />
                      Ny produkt
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setCategoryManagerOpen(true)} className="h-10 rounded-xl px-3.5">
                      <Folders size={16} weight="bold" />
                      Hantera kategorier
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div layout>
                  <AnimatePresence initial={false}>
                    {filteredProducts.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        meta={productMetas.get(product.id)}
                        deleting={deletingId === product.id}
                        onEdit={openEdit}
                        onToggleActive={handleToggleActive}
                        onDelete={setDeleteProduct}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </section>
        </div>
      </motion.div>

      {modalOpen && (
        <ProductModal
          key={editingProduct?.id ?? 'new-product'}
          open={modalOpen}
          product={editingProduct}
          categories={categoryTree}
          categoryById={categoryById}
          categorySupport={categorySupport}
          categorySupportMessage={categorySupportMessage}
          saving={saving}
          onClose={closeModal}
          onSave={handleSave}
          onOpenCategoryManager={() => setCategoryManagerOpen(true)}
        />
      )}

      <CategoryManagerDialog
        open={categoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
        categories={categoryTree}
        supportState={categorySupport}
        supportMessage={categorySupportMessage}
        mainCounts={mainCounts}
        subCounts={subCounts}
        onCreateCategory={handleCreateCategory}
        onDeleteCategory={handleDeleteCategory}
        saving={categorySaving}
        deletingId={deletingCategoryId}
      />

      <Dialog open={Boolean(deleteProduct)} onOpenChange={(open) => { if (!open) setDeleteProduct(null); }}>
        <DialogContent mobileVariant="sheet" showMobileClose className="sm:max-w-xl">
          <DialogHeader className="pr-16">
            <DialogTitle>Ta bort produkt?</DialogTitle>
            <DialogDescription>
              Produkten försvinner från biblioteket och visas inte längre i offertflödet.
            </DialogDescription>
          </DialogHeader>

          {deleteProduct && (
            <div className="mx-5 rounded-[20px] border border-[var(--border)] bg-[var(--surface-alt)] p-3.5">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{deleteProduct.name}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                {productMetas.get(deleteProduct.id)?.label && (
                  <span className="rounded-full bg-[var(--surface-3)] px-2 py-1">
                    {productMetas.get(deleteProduct.id)?.label}
                  </span>
                )}
                <span className="rounded-full bg-[var(--surface-3)] px-2 py-1">{formatSek(deleteProduct.unitPrice)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteProduct(null)}>
              Avbryt
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!deleteProduct || deletingId === deleteProduct.id}
              onClick={() => {
                if (deleteProduct) {
                  void handleDeleteProduct(deleteProduct);
                }
              }}
            >
              {deleteProduct && deletingId === deleteProduct.id ? 'Tar bort…' : 'Ta bort'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}










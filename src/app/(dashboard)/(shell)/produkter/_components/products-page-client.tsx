'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { useActiveCompany } from '@shared/hooks/use-active-company';
import {
  ProductApiError,
  createProduct,
  createProductCategory,
  deleteProduct as deleteProductRecord,
  deleteProductCategory,
  listProductCategories,
  listProducts,
  updateProduct,
  type OfferProduct,
  type ProductCategory,
} from '@shared/lib/api/products.api';
import { CategoryManagerDialog } from './category-manager-dialog';
import { ProductModal } from './product-modal';
import {
  ProductFilterPanel,
  ProductLibraryHeader,
  ProductLibraryPanel,
} from './product-library-sections';
import type {
  CategoryComposerPayload,
  CategoryFilterKey,
  CategorySupportState,
  ProductCategoryMeta,
  ProductForm,
} from './product-library.types';
import {
  buildCategoryTree,
  buildStructuredCategoryLabel,
  getProductCategoryMeta,
  normalizeSearch,
} from './product-library.utils';

export function ProductsPageClient() {
  const searchParams = useSearchParams();
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
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
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
    setProducts(await listProducts({ companyId: selectedCompanyId || undefined }));
  }, [selectedCompanyId]);

  const loadCategories = useCallback(async () => {
    try {
      const categories = await listProductCategories({ companyId: selectedCompanyId || undefined });
      setCategorySupport('available');
      setCategorySupportMessage(null);
      setRawCategories(categories);
    } catch (err) {
      if (err instanceof ProductApiError && err.status === 503) {
        setCategorySupport('unavailable');
        setCategorySupportMessage(err.message);
        setRawCategories([]);
        return;
      }
      throw err;
    }
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
  const activeMainFilterId = categoryFilter.startsWith('main:') ? categoryFilter.slice(5) : '';
  const hasActiveFilters = Boolean(search || categoryFilter || showInactive);

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

  const openCategoryManager = () => {
    setCategoryManagerOpen(true);
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setShowInactive(false);
  };

  const handleCreateCategory = useCallback(async (payload: CategoryComposerPayload) => {
    setCategorySaving(true);
    setError(null);
    try {
      await createProductCategory({
        ...payload,
        companyId: selectedCompanyId || undefined,
      });
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
      await deleteProductCategory(categoryId);
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

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
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
      await updateProduct(product.id, {
        isActive: !product.isActive,
        companyId: selectedCompanyId || undefined,
      });

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
      await deleteProductRecord(product.id);
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

  const renderFilterPanel = () => (
    <ProductFilterPanel
      productsCount={products.length}
      uncategorizedCount={uncategorizedCount}
      showInactive={showInactive}
      categoryFilter={categoryFilter}
      activeMainFilterId={activeMainFilterId}
      categoryTree={categoryTree}
      categorySupport={categorySupport}
      categorySupportMessage={categorySupportMessage}
      mainCounts={mainCounts}
      subCounts={subCounts}
      legacyCounts={legacyCounts}
      legacyCategoryLabels={legacyCategoryLabels}
      onShowInactiveChange={setShowInactive}
      onCategoryFilterChange={setCategoryFilter}
      onManageCategories={openCategoryManager}
    />
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="space-y-6">
        <ProductLibraryHeader
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          companyLoading={companyLoading}
          companyError={companyError}
          productCount={products.length}
          activeCount={activeCount}
          totalVisible={totalVisible}
          onSelectCompany={setSelectedCompanyId}
          onCreateProduct={openCreate}
          onManageCategories={openCategoryManager}
        />

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-[24px] border border-[var(--status-danger-bg)] bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger-text)]"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden h-fit rounded-[26px] border border-[var(--border)] bg-[var(--surface-0)] p-4 shadow-sm xl:sticky xl:top-6 xl:block">
            <div className="mb-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Filter</p>
            </div>
            {renderFilterPanel()}
          </aside>

          <ProductLibraryPanel
            loading={loading}
            products={filteredProducts}
            productMetas={productMetas}
            deletingId={deletingId}
            search={search}
            filtersOpen={filtersOpen}
            hasActiveFilters={hasActiveFilters}
            filterPanel={renderFilterPanel()}
            onSearchChange={setSearch}
            onFiltersOpenChange={setFiltersOpen}
            onResetFilters={resetFilters}
            onReload={() => void reloadAll()}
            onCreateProduct={openCreate}
            onManageCategories={openCategoryManager}
            onEdit={openEdit}
            onToggleActive={handleToggleActive}
            onDelete={setDeleteProduct}
          />
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
          onOpenCategoryManager={openCategoryManager}
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

      <ConfirmDestructiveDialog
        open={Boolean(deleteProduct)}
        onOpenChange={(open) => {
          if (!open) setDeleteProduct(null);
        }}
        title={deleteProduct ? `Ta bort ${deleteProduct.name}?` : 'Ta bort produkt?'}
        description="Produkten försvinner från biblioteket och visas inte längre i offertflödet."
        confirmLabel="Ta bort"
        loading={!!deleteProduct && deletingId === deleteProduct.id}
        onConfirm={() => {
          if (deleteProduct) {
            void handleDeleteProduct(deleteProduct);
          }
        }}
      />
    </div>
  );
}

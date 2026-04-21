'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import {
  ArrowsClockwise,
  FolderOpen,
  Folders,
  MagnifyingGlass,
  Plus,
  Sparkle,
} from '@phosphor-icons/react';
import { Button } from '@shared/ui/button';
import { CompanyScopeSelector } from '@shared/ui/company-scope-selector';
import type { ActiveCompanyOption } from '@shared/hooks/use-active-company';
import type { OfferProduct } from '@shared/lib/api/products.api';
import { cn } from '@shared/lib/utils';
import { ProductRow } from './product-row';
import type {
  CategoryFilterKey,
  CategoryNode,
  CategorySupportState,
  ProductCategoryMeta,
} from './product-library.types';

interface ProductLibraryHeaderProps {
  companies: ActiveCompanyOption[];
  selectedCompanyId: string;
  companyLoading: boolean;
  companyError: string | null;
  productCount: number;
  activeCount: number;
  totalVisible: number;
  onSelectCompany: (companyId: string) => void;
  onCreateProduct: () => void;
  onManageCategories: () => void;
}

export function ProductLibraryHeader({
  companies,
  selectedCompanyId,
  companyLoading,
  companyError,
  productCount,
  activeCount,
  totalVisible,
  onSelectCompany,
  onCreateProduct,
  onManageCategories,
}: ProductLibraryHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface-0)] shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-3 px-5 py-5 sm:px-6">
          <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Produktbibliotek
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            Håll biblioteket snabbt, tydligt och lätt att lita på.
          </h1>

          <div className="grid max-w-sm grid-cols-3 gap-2">
            <ProductStat label="Produkter" value={productCount} />
            <ProductStat label="Aktiva nu" value={activeCount} />
            <ProductStat label="Visas nu" value={totalVisible} />
          </div>

          {companies.length > 1 && (
            <CompanyScopeSelector
              companies={companies}
              selectedCompanyId={selectedCompanyId}
              onSelect={onSelectCompany}
              compact
              title="Företagets bibliotek"
              description="Byt företag för att se rätt produkter och kategorier."
            />
          )}
          {companyLoading && (
            <p className="text-xs text-[var(--text-muted)]">Läser in företagets bibliotek...</p>
          )}
          {companyError && (
            <p className="text-xs text-[var(--status-warning-text)]">{companyError}</p>
          )}
        </div>

        <aside className="flex flex-col justify-center gap-2 border-t border-[var(--border)] px-5 py-5 lg:border-l lg:border-t-0">
          <Button type="button" onClick={onCreateProduct} className="h-10 rounded-xl px-3.5">
            <Plus size={16} weight="bold" />
            Ny produkt
          </Button>
          <Button type="button" variant="outline" onClick={onManageCategories} className="h-10 rounded-xl px-3.5">
            <Folders size={16} weight="bold" />
            Hantera kategorier
          </Button>
        </aside>
      </div>
    </section>
  );
}

function ProductStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

interface ProductFilterPanelProps {
  productsCount: number;
  uncategorizedCount: number;
  showInactive: boolean;
  categoryFilter: CategoryFilterKey;
  activeMainFilterId: string;
  categoryTree: CategoryNode[];
  categorySupport: CategorySupportState;
  categorySupportMessage: string | null;
  mainCounts: Map<string, number>;
  subCounts: Map<string, number>;
  legacyCounts: Map<string, number>;
  legacyCategoryLabels: string[];
  onShowInactiveChange: (showInactive: boolean) => void;
  onCategoryFilterChange: (filter: CategoryFilterKey) => void;
  onManageCategories: () => void;
}

export function ProductFilterPanel({
  productsCount,
  uncategorizedCount,
  showInactive,
  categoryFilter,
  activeMainFilterId,
  categoryTree,
  categorySupport,
  categorySupportMessage,
  mainCounts,
  subCounts,
  legacyCounts,
  legacyCategoryLabels,
  onShowInactiveChange,
  onCategoryFilterChange,
  onManageCategories,
}: ProductFilterPanelProps) {
  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-3 text-sm text-[var(--text-secondary)]">
        Visa inaktiva
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(event) => onShowInactiveChange(event.target.checked)}
          className="rounded border-[var(--border)]"
        />
      </label>

      <QuickFilters
        productsCount={productsCount}
        uncategorizedCount={uncategorizedCount}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={onCategoryFilterChange}
      />

      <CategoryHierarchyFilter
        categoryTree={categoryTree}
        categorySupport={categorySupport}
        categorySupportMessage={categorySupportMessage}
        activeMainFilterId={activeMainFilterId}
        categoryFilter={categoryFilter}
        mainCounts={mainCounts}
        subCounts={subCounts}
        onCategoryFilterChange={onCategoryFilterChange}
        onManageCategories={onManageCategories}
      />

      {legacyCategoryLabels.length > 0 && (
        <LegacyCategoryFilter
          labels={legacyCategoryLabels}
          counts={legacyCounts}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
        />
      )}
    </div>
  );
}

function QuickFilters({
  productsCount,
  uncategorizedCount,
  categoryFilter,
  onCategoryFilterChange,
}: {
  productsCount: number;
  uncategorizedCount: number;
  categoryFilter: CategoryFilterKey;
  onCategoryFilterChange: (filter: CategoryFilterKey) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Snabbfilter</p>
      <div className="space-y-1.5">
        <FilterButton
          active={!categoryFilter}
          label="Alla produkter"
          count={productsCount}
          onClick={() => onCategoryFilterChange('')}
        />
        <FilterButton
          active={categoryFilter === 'uncategorized'}
          label="Okategoriserade"
          count={uncategorizedCount}
          onClick={() => onCategoryFilterChange('uncategorized')}
        />
      </div>
    </div>
  );
}

function FilterButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-colors',
        active ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)]',
      )}
    >
      <span>{label}</span>
      <span className="rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-xs">{count}</span>
    </button>
  );
}

function CategoryHierarchyFilter({
  categoryTree,
  categorySupport,
  categorySupportMessage,
  activeMainFilterId,
  categoryFilter,
  mainCounts,
  subCounts,
  onCategoryFilterChange,
  onManageCategories,
}: {
  categoryTree: CategoryNode[];
  categorySupport: CategorySupportState;
  categorySupportMessage: string | null;
  activeMainFilterId: string;
  categoryFilter: CategoryFilterKey;
  mainCounts: Map<string, number>;
  subCounts: Map<string, number>;
  onCategoryFilterChange: (filter: CategoryFilterKey) => void;
  onManageCategories: () => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Hierarki</p>
        <button type="button" onClick={onManageCategories} className="text-xs font-medium text-[var(--accent)]">
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
                onClick={() => onCategoryFilterChange(`main:${node.main.id}`)}
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
                      onClick={() => onCategoryFilterChange(`sub:${child.id}`)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs transition-colors',
                        categoryFilter === `sub:${child.id}`
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--surface-0)] text-[var(--text-secondary)] hover:bg-[var(--surface)]',
                      )}
                    >
                      {child.name} - {subCounts.get(child.id) ?? 0}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LegacyCategoryFilter({
  labels,
  counts,
  categoryFilter,
  onCategoryFilterChange,
}: {
  labels: string[];
  counts: Map<string, number>;
  categoryFilter: CategoryFilterKey;
  onCategoryFilterChange: (filter: CategoryFilterKey) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Äldre fria etiketter</p>
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => onCategoryFilterChange(`legacy:${label}`)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs transition-colors',
              categoryFilter === `legacy:${label}`
                ? 'border-[var(--accent)] bg-[var(--accent)]/8 text-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)]',
            )}
          >
            {label} - {counts.get(label) ?? 0}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ProductLibraryPanelProps {
  loading: boolean;
  products: OfferProduct[];
  productMetas: Map<string, ProductCategoryMeta>;
  deletingId: string | null;
  search: string;
  filtersOpen: boolean;
  hasActiveFilters: boolean;
  filterPanel: ReactNode;
  onSearchChange: (search: string) => void;
  onFiltersOpenChange: (open: boolean) => void;
  onResetFilters: () => void;
  onReload: () => void;
  onCreateProduct: () => void;
  onManageCategories: () => void;
  onEdit: (product: OfferProduct) => void;
  onToggleActive: (product: OfferProduct) => void;
  onDelete: (product: OfferProduct) => void;
}

export function ProductLibraryPanel({
  loading,
  products,
  productMetas,
  deletingId,
  search,
  filtersOpen,
  hasActiveFilters,
  filterPanel,
  onSearchChange,
  onFiltersOpenChange,
  onResetFilters,
  onReload,
  onCreateProduct,
  onManageCategories,
  onEdit,
  onToggleActive,
  onDelete,
}: ProductLibraryPanelProps) {
  return (
    <section className="order-1 overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface-0)] shadow-sm xl:order-2">
      <div className="border-b border-[var(--border)] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-base font-semibold text-[var(--text-primary)]">Bibliotek</p>
          <div className="flex flex-wrap gap-2">
            {hasActiveFilters && (
              <Button type="button" variant="outline" onClick={onResetFilters} className="h-10 rounded-xl px-3.5">
                <ArrowsClockwise size={16} weight="bold" />
                Rensa
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onReload} className="h-10 rounded-xl px-3.5">
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
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Sök namn, beskrivning, SKU, enhet eller kategori"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={() => onFiltersOpenChange(!filtersOpen)}
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
          <ProductLoadingSkeleton />
        ) : products.length === 0 ? (
          <ProductEmptyState
            hasActiveFilters={hasActiveFilters}
            onCreateProduct={onCreateProduct}
            onManageCategories={onManageCategories}
          />
        ) : (
          <motion.div layout>
            <AnimatePresence initial={false}>
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  meta={productMetas.get(product.id)}
                  deleting={deletingId === product.id}
                  onEdit={onEdit}
                  onToggleActive={onToggleActive}
                  onDelete={onDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function ProductLoadingSkeleton() {
  return (
    <div>
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-14 animate-pulse border-b border-[var(--border)] last:border-b-0" />
      ))}
    </div>
  );
}

function ProductEmptyState({
  hasActiveFilters,
  onCreateProduct,
  onManageCategories,
}: {
  hasActiveFilters: boolean;
  onCreateProduct: () => void;
  onManageCategories: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      className="m-4 flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-6 text-center"
    >
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
        <Button type="button" onClick={onCreateProduct} className="h-10 rounded-xl px-3.5">
          <Plus size={16} weight="bold" />
          Ny produkt
        </Button>
        <Button type="button" variant="outline" onClick={onManageCategories} className="h-10 rounded-xl px-3.5">
          <Folders size={16} weight="bold" />
          Hantera kategorier
        </Button>
      </div>
    </motion.div>
  );
}

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { ArrowsClockwise, Check, Copy, FolderOpen, Folders, MagnifyingGlass, Plus, Sparkle } from '@phosphor-icons/react';
import { Button } from '@shared/ui/button';
import type { OfferProduct } from '@shared/lib/api/products.api';
import { ProductRow } from './product-row';
import type { ProductCategoryMeta } from './product-library.types';

interface ProductLibraryPanelProps {
  loading: boolean;
  products: OfferProduct[];
  productMetas: Map<string, ProductCategoryMeta>;
  deletingId: string | null;
  search: string;
  filtersOpen: boolean;
  hasActiveFilters: boolean;
  viewLinkCopied: boolean;
  filterPanel: ReactNode;
  onSearchChange: (search: string) => void;
  onFiltersOpenChange: (open: boolean) => void;
  onResetFilters: () => void;
  onCopyViewLink: () => void;
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
  viewLinkCopied,
  filterPanel,
  onSearchChange,
  onFiltersOpenChange,
  onResetFilters,
  onCopyViewLink,
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
            <Button type="button" variant="outline" onClick={onCopyViewLink} className="h-10 rounded-xl px-3.5">
              {viewLinkCopied ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
              Kopiera vy
            </Button>
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

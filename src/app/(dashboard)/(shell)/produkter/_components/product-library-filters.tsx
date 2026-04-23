'use client';

import { cn } from '@shared/lib/utils';
import type { CategoryFilterKey, CategoryNode, CategorySupportState } from './product-library.types';

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

'use client';

import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@shared/ui/input';
import { cn } from '@shared/lib/utils';
import type { AttendanceShift } from '@shared/lib/api/attendance.api';
import type { RestaurantMenuCategory, RestaurantMenuItem } from '@shared/lib/api/restaurant.api';
import type { RestaurantOrderSummary } from '@shared/lib/api/restaurant-orders.api';
import { availableItems, menuItemPriceLabel, money } from './kassa-helpers';

export function KassaProductWorkbench({
  categories,
  selectedCategoryId,
  productSearch,
  activeOrderCount,
  draftLineCount,
  summary,
  currentShift,
  canReadReports,
  onProductSearchChange,
  onSelectedCategoryChange,
  onAddMenuItem,
}: {
  categories: RestaurantMenuCategory[];
  selectedCategoryId: string;
  productSearch: string;
  activeOrderCount: number;
  draftLineCount: number;
  summary: RestaurantOrderSummary | null;
  currentShift: AttendanceShift | null;
  canReadReports: boolean;
  onProductSearchChange: (value: string) => void;
  onSelectedCategoryChange: (categoryId: string) => void;
  onAddMenuItem: (item: RestaurantMenuItem) => void;
}) {
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? categories[0] ?? null;
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return [];
    const query = productSearch.trim().toLowerCase();
    const items = availableItems(selectedCategory);
    if (!query) return items;
    return items.filter((item) => (
      item.name.toLowerCase().includes(query)
      || item.description?.toLowerCase().includes(query)
      || item.tags.some((tag) => tag.toLowerCase().includes(query))
    ));
  }, [productSearch, selectedCategory]);

  return (
    <section className="grid min-h-0 grid-rows-[auto_auto_1fr] border-r border-[var(--ui-border)]">
      <div className="grid gap-3 border-b border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" size={16} strokeWidth={1.75} />
          <Input
            value={productSearch}
            onChange={(event) => onProductSearchChange(event.target.value)}
            placeholder="Sök pizza, subs, dryck..."
            className="h-12 pl-9"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-5 lg:min-w-[420px]">
          <WorkbenchMetric label="Aktiva" value={activeOrderCount} />
          <WorkbenchMetric label="Obetalda" value={summary?.unpaidOrderCount ?? 0} />
          <WorkbenchMetric label="Kvitto" value={draftLineCount} />
          <WorkbenchMetric className="hidden sm:block" label="Idag" value={canReadReports ? money(summary?.salesCents ?? 0) : '-'} />
          <WorkbenchMetric className="hidden sm:block" label="Pass" value={currentShift ? 'Ja' : 'Nej'} />
        </div>
      </div>

      <div className="flex min-h-[68px] items-center gap-2 overflow-x-auto border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectedCategoryChange(category.id)}
            className={cn(
              'h-11 shrink-0 rounded-[var(--ui-radius-md)] border px-4 text-sm font-semibold transition-colors',
              selectedCategory?.id === category.id
                ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent)] text-[var(--ui-text-inverse)]'
                : 'border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-hover)]',
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="min-h-0 overflow-y-auto p-3">
        {selectedCategory ? (
          filteredItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredItems.map((item) => (
                <ProductCard key={item.id} item={item} onAddMenuItem={onAddMenuItem} />
              ))}
            </div>
          ) : (
            <WorkbenchEmptyState>Inga produkter matchar sökningen.</WorkbenchEmptyState>
          )
        ) : (
          <WorkbenchEmptyState>Ingen prissatt meny hittades.</WorkbenchEmptyState>
        )}
      </div>
    </section>
  );
}

function WorkbenchMetric({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={cn('rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-1.5', className)}>
      <span className="block font-semibold tabular-nums">{value}</span>
      <span className="text-[var(--ui-text-muted)]">{label}</span>
    </div>
  );
}

function ProductCard({
  item,
  onAddMenuItem,
}: {
  item: RestaurantMenuItem;
  onAddMenuItem: (item: RestaurantMenuItem) => void;
}) {
  const hasOptions = (item.modifierGroups ?? []).length > 0 || (item.variants ?? []).length > 1;
  return (
    <button
      type="button"
      onClick={() => onAddMenuItem(item)}
      className="grid min-h-[176px] grid-rows-[92px_1fr] overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] text-left shadow-sm transition-colors hover:border-[var(--ui-accent-border)] hover:bg-[var(--ui-surface-hover)] active:bg-[var(--ui-surface-selected)]"
    >
      <span className="grid overflow-hidden bg-[var(--ui-surface-subtle)]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full place-items-center text-xs font-semibold text-[var(--ui-text-muted)]">Fluffy&apos;s</span>
        )}
      </span>
      <span className="flex flex-col justify-between gap-2 p-3">
        <span className="line-clamp-2 text-sm font-semibold leading-5">{item.name}</span>
        <span className="flex items-end justify-between gap-2">
          <span className="text-base font-bold tabular-nums">{menuItemPriceLabel(item)}</span>
          {hasOptions ? <span className="text-[11px] font-semibold text-[var(--ui-accent)]">Val</span> : null}
        </span>
      </span>
    </button>
  );
}

function WorkbenchEmptyState({ children }: { children: string }) {
  return <div className="grid h-full place-items-center text-sm text-[var(--ui-text-muted)]">{children}</div>;
}

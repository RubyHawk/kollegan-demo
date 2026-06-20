'use client';

import { useMemo, useState } from 'react';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { cn } from '@shared/lib/utils';
import type { RestaurantMenuCategory, RestaurantMenuItem } from '@shared/lib/api/restaurant.api';
import { availableItems, menuItemFallbackImage, menuItemPriceLabel } from './kassa-helpers';

export function KassaProductWorkbench({
  categories,
  selectedCategoryId,
  productSearch,
  customName,
  customPrice,
  onProductSearchChange,
  onSelectedCategoryChange,
  onAddMenuItem,
  onCustomNameChange,
  onCustomPriceChange,
  onAddCustomItem,
}: {
  categories: RestaurantMenuCategory[];
  selectedCategoryId: string;
  productSearch: string;
  customName: string;
  customPrice: string;
  onProductSearchChange: (value: string) => void;
  onSelectedCategoryChange: (categoryId: string) => void;
  onAddMenuItem: (item: RestaurantMenuItem) => void;
  onCustomNameChange: (value: string) => void;
  onCustomPriceChange: (value: string) => void;
  onAddCustomItem: () => void;
}) {
  const [openItemVisible, setOpenItemVisible] = useState(false);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? categories[0] ?? null;
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return [];
    const query = productSearch.trim().toLowerCase();
    const items = availableItems(selectedCategory);
    if (!query) return items;
    return items.filter((item) => (
      item.name.toLowerCase().includes(query)
      || item.description?.toLowerCase().includes(query)
      || item.ingredients.some((ingredient) => ingredient.name.toLowerCase().includes(query))
      || item.tags.some((tag) => tag.toLowerCase().includes(query))
    ));
  }, [productSearch, selectedCategory]);

  return (
    <section className="fluffy-product-workbench grid min-h-0 grid-rows-[auto_auto_1fr] border-r border-[var(--ui-border)]">
      <div className="fluffy-workbench-toolbar grid gap-3 border-b border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" size={18} strokeWidth={1.75} />
          <Input
            value={productSearch}
            onChange={(event) => onProductSearchChange(event.target.value)}
            placeholder="Sök produkt eller PLU..."
            className="pl-11"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" aria-label="Filter" className="h-12 w-12">
            <SlidersHorizontal />
          </Button>
          <Button
            type="button"
            variant={openItemVisible ? 'default' : 'secondary'}
            size="compact"
            className="h-12 px-4"
            onClick={() => setOpenItemVisible((value) => !value)}
          >
            <Plus data-icon="inline-start" />
            Open item
          </Button>
        </div>
        {openItemVisible ? (
          <div className="grid gap-2 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-2 sm:grid-cols-[minmax(0,1fr)_110px_auto] lg:col-span-2">
            <Input
              value={customName}
              onChange={(event) => onCustomNameChange(event.target.value)}
              placeholder="Fri rad"
              className="h-11"
            />
            <Input
              value={customPrice}
              onChange={(event) => onCustomPriceChange(event.target.value)}
              placeholder="Pris"
              inputMode="decimal"
              className="h-11"
            />
            <Button type="button" variant="secondary" onClick={onAddCustomItem}>
              Lägg till
            </Button>
          </div>
        ) : null}
      </div>

      <div className="fluffy-category-strip flex items-center gap-3 overflow-x-auto border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectedCategoryChange(category.id)}
            className={cn(
              'fluffy-category-pill shrink-0 border px-5 text-sm font-semibold transition-colors',
              selectedCategory?.id === category.id
                ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent)] text-[var(--ui-text-inverse)]'
                : 'border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-hover)]',
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="min-h-0 overflow-y-auto p-4">
        {selectedCategory ? (
          filteredItems.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(178px,1fr))] gap-3">
              {filteredItems.map((item) => (
                <ProductCard
                  key={item.id}
                  categoryName={selectedCategory.name}
                  item={item}
                  onAddMenuItem={onAddMenuItem}
                />
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

function ProductCard({
  categoryName,
  item,
  onAddMenuItem,
}: {
  categoryName: string;
  item: RestaurantMenuItem;
  onAddMenuItem: (item: RestaurantMenuItem) => void;
}) {
  const hasOptions = (item.modifierGroups ?? []).length > 0 || (item.variants ?? []).length > 1;
  const description = item.description || item.ingredients.slice(0, 3).map((ingredient) => ingredient.name).join(', ');
  const hasCustomImage = Boolean(item.imageUrl);
  const imageSrc = item.imageUrl ?? menuItemFallbackImage(categoryName, item.name);
  return (
    <article className="fluffy-product-ticket grid min-h-[198px] grid-rows-[98px_1fr] overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] text-left">
      <div className="fluffy-product-ticket__media grid overflow-hidden bg-[var(--ui-surface-subtle)]" data-fallback={hasCustomImage ? undefined : 'true'}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex min-h-0 flex-col justify-between gap-2 p-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-bold leading-5">{item.name}</h3>
          {description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-4 text-[var(--ui-text-secondary)]">{description}</p>
          ) : null}
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="fluffy-product-ticket__price tabular-nums">{menuItemPriceLabel(item)}</p>
            {hasOptions ? <p className="text-[11px] font-semibold text-[var(--ui-accent)]">Val finns</p> : null}
          </div>
          <Button
            type="button"
            size="icon"
            className="fluffy-product-add size-8"
            aria-label={`Lägg till ${item.name}`}
            onClick={() => onAddMenuItem(item)}
          >
            <Plus />
          </Button>
        </div>
      </div>
    </article>
  );
}

function WorkbenchEmptyState({ children }: { children: string }) {
  return <div className="grid h-full place-items-center text-sm text-[var(--ui-text-muted)]">{children}</div>;
}

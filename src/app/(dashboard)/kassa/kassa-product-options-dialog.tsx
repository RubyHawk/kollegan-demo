'use client';

import { useMemo, useState } from 'react';
import { Button } from '@shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ModalActionFooter,
  ModalBody,
} from '@shared/ui/dialog';
import { cn } from '@shared/lib/utils';
import type { RestaurantMenuItem } from '@shared/lib/api/restaurant.api';
import type { RestaurantOrderModifierSelection } from '@shared/lib/api/restaurant-orders.api';
import { type DraftItem, menuItemBasePrice, money } from './kassa-helpers';

type DraftLineInput = Omit<DraftItem, 'draftId'>;

function keyOf(groupId: string | null, name: string) {
  return groupId ?? name;
}

export function KassaProductOptionsDialog({
  item,
  open,
  onOpenChange,
  onAdd,
}: {
  item: RestaurantMenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (line: DraftLineInput) => void;
}) {
  const availableVariants = useMemo(
    () => item?.variants?.filter((variant) => variant.isAvailable) ?? [],
    [item],
  );
  const defaultVariant = availableVariants.find((variant) => variant.isDefault) ?? availableVariants[0] ?? null;
  const [variantName, setVariantName] = useState<string | null>(defaultVariant?.name ?? null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = availableVariants.find((variant) => variant.name === variantName) ?? defaultVariant;
  const selectedModifiers = useMemo<RestaurantOrderModifierSelection[]>(() => {
    if (!item) return [];
    return (item.modifierGroups ?? []).flatMap((group) => {
      const selected = selectedOptions[keyOf(group.id, group.name)] ?? [];
      return group.options
        .filter((option) => option.isAvailable && selected.includes(option.id ?? option.name))
        .map((option) => ({
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          optionName: option.name,
          priceDeltaCents: option.priceDeltaCents,
        }));
    });
  }, [item, selectedOptions]);

  if (!item) return null;
  const activeItem = item;

  const basePrice = selectedVariant?.priceCents ?? menuItemBasePrice(activeItem) ?? 0;
  const modifierTotal = selectedModifiers.reduce((sum, modifier) => sum + modifier.priceDeltaCents, 0);
  const unitPrice = basePrice + modifierTotal;
  const requiredMissing = (activeItem.modifierGroups ?? []).some((group) => {
    if (group.minSelected <= 0) return false;
    return (selectedOptions[keyOf(group.id, group.name)] ?? []).length < group.minSelected;
  });

  function toggleOption(groupKey: string, optionKey: string, maxSelected: number) {
    setSelectedOptions((current) => {
      const selected = current[groupKey] ?? [];
      const exists = selected.includes(optionKey);
      const next = exists
        ? selected.filter((value) => value !== optionKey)
        : maxSelected === 1
          ? [optionKey]
          : selected.length >= maxSelected
            ? selected
            : [...selected, optionKey];
      return { ...current, [groupKey]: next };
    });
  }

  function addLine() {
    onAdd({
      menuItemId: activeItem.id,
      imageUrl: activeItem.imageUrl,
      name: activeItem.name,
      quantity,
      variantName: selectedVariant?.name ?? null,
      variantPriceCents: selectedVariant?.priceCents ?? null,
      selectedModifiers,
      modifierTotalCents: modifierTotal,
      basePriceCents: basePrice,
      unitPriceCents: unitPrice,
      note: null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileVariant="sheet" size="lg" showMobileClose closeLabel="Stäng">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>Välj storlek och tillval innan raden läggs på kvittot.</DialogDescription>
        </DialogHeader>
        <ModalBody className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="space-y-3">
            <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)]">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="px-4 text-center text-sm font-semibold text-[var(--ui-text-muted)]">
                  Fluffy&apos;s
                </span>
              )}
            </div>
            {activeItem.description ? (
              <p className="text-sm leading-6 text-[var(--ui-text-secondary)]">{activeItem.description}</p>
            ) : null}
            <div className="flex items-center justify-between rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2">
              <span className="text-sm text-[var(--ui-text-muted)]">Radpris</span>
              <span className="text-lg font-semibold tabular-nums">{money(unitPrice)}</span>
            </div>
          </div>

          <div className="space-y-4">
            {availableVariants.length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Storlek</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {availableVariants.map((variant) => (
                    <button
                      key={variant.id ?? variant.name}
                      type="button"
                      onClick={() => setVariantName(variant.name)}
                      className={cn(
                        'min-h-12 rounded-[var(--ui-radius-md)] border px-3 py-2 text-left text-sm transition-colors',
                        selectedVariant?.name === variant.name
                          ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] text-[var(--ui-text)]'
                          : 'border-[var(--ui-border)] bg-[var(--ui-surface)] hover:bg-[var(--ui-surface-hover)]',
                      )}
                    >
                      <span className="block font-semibold">{variant.name}</span>
                      <span className="text-xs text-[var(--ui-text-muted)]">{money(variant.priceCents)}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {(activeItem.modifierGroups ?? []).map((group) => {
              const groupKey = keyOf(group.id, group.name);
              const selected = selectedOptions[groupKey] ?? [];
              return (
                <section key={groupKey} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">{group.name}</h3>
                    <span className="text-xs text-[var(--ui-text-muted)]">
                      {group.minSelected > 0 ? `Minst ${group.minSelected}` : 'Valfritt'} · max {group.maxSelected}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.options.filter((option) => option.isAvailable).map((option) => {
                      const optionKey = option.id ?? option.name;
                      const active = selected.includes(optionKey);
                      return (
                        <button
                          key={optionKey}
                          type="button"
                          onClick={() => toggleOption(groupKey, optionKey, group.maxSelected)}
                          className={cn(
                            'min-h-12 rounded-[var(--ui-radius-md)] border px-3 py-2 text-left text-sm transition-colors',
                            active
                              ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] text-[var(--ui-text)]'
                              : 'border-[var(--ui-border)] bg-[var(--ui-surface)] hover:bg-[var(--ui-surface-hover)]',
                          )}
                        >
                          <span className="block font-semibold">{option.name}</span>
                          {option.priceDeltaCents > 0 ? (
                            <span className="text-xs text-[var(--ui-text-muted)]">+{money(option.priceDeltaCents)}</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </ModalBody>
        <ModalActionFooter>
          <div className="mr-auto flex h-11 items-center overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--ui-border)]">
            <button type="button" className="h-11 w-11 text-lg" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>-</button>
            <span className="w-12 text-center text-sm font-semibold tabular-nums">{quantity}</span>
            <button type="button" className="h-11 w-11 text-lg" onClick={() => setQuantity((value) => Math.min(99, value + 1))}>+</button>
          </div>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button type="button" disabled={requiredMissing} onClick={addLine}>
            Lägg till {money(unitPrice * quantity)}
          </Button>
        </ModalActionFooter>
      </DialogContent>
    </Dialog>
  );
}

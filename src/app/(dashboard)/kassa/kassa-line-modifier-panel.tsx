'use client';

import { Minus, Plus, X } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { cn } from '@shared/lib/utils';
import type {
  MenuItemModifierGroup,
  MenuItemModifierOption,
  MenuItemVariant,
  RestaurantMenuItem,
} from '@shared/lib/api/restaurant.api';
import type { DraftItem } from './kassa-helpers';
import { modifierSummary, money } from './kassa-helpers';

export function KassaLineModifierPanel({
  draftItem,
  menuItem,
  onClose,
  onVariantChange,
  onModifierToggle,
  onNoteChange,
  onQuantityChange,
}: {
  draftItem: DraftItem | null;
  menuItem: RestaurantMenuItem | null;
  onClose: () => void;
  onVariantChange: (draftId: string, variant: MenuItemVariant) => void;
  onModifierToggle: (draftId: string, group: MenuItemModifierGroup, option: MenuItemModifierOption) => void;
  onNoteChange: (draftId: string, note: string) => void;
  onQuantityChange: (draftId: string, delta: number) => void;
}) {
  if (!draftItem) {
    return (
      <aside className="fluffy-context-panel grid min-h-0 place-items-center border-r border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 text-center text-sm text-[var(--ui-text-muted)]">
        Välj en rad i ordern för tillval.
      </aside>
    );
  }

  const variants = (menuItem?.variants ?? []).filter((variant) => variant.isAvailable);
  const modifierGroups = menuItem?.modifierGroups ?? [];
  const selectedSummary = modifierSummary(draftItem.selectedModifiers);

  return (
    <aside className="fluffy-context-panel grid min-h-0 grid-rows-[auto_1fr_auto] border-r border-[var(--ui-border)] bg-[var(--ui-surface)]">
      <header className="flex items-start justify-between gap-3 border-b border-[var(--ui-border)] px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-[var(--ui-text-muted)]">Tillval</p>
          <h2 className="truncate text-base font-semibold">{draftItem.name}</h2>
          <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
            {selectedSummary || 'Inga tillval valda'}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Stäng tillval" onClick={onClose}>
          <X />
        </Button>
      </header>

      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-3">
        {variants.length > 0 ? (
          <section className="flex flex-col gap-2">
            <p className="text-sm font-semibold">Storlek / variant</p>
            <div className="grid grid-cols-2 gap-2">
              {variants.map((variant) => {
                const selected = draftItem.variantName === variant.name
                  || (!draftItem.variantName && variant.isDefault);
                return (
                  <button
                    key={`${variant.id ?? variant.name}:${variant.priceCents}`}
                    type="button"
                    onClick={() => onVariantChange(draftItem.draftId, variant)}
                    className={cn(
                      'min-h-12 rounded-[var(--ui-radius-md)] border px-3 py-2 text-left text-sm transition-colors',
                      selected
                        ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] text-[var(--ui-accent)]'
                        : 'border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] hover:bg-[var(--ui-surface-hover)]',
                    )}
                  >
                    <span className="block font-semibold">{variant.name}</span>
                    <span className="text-xs text-[var(--ui-text-muted)]">{money(variant.priceCents)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {modifierGroups.map((group) => (
          <section key={`${group.id ?? group.name}`} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{group.name}</p>
              <span className="text-xs text-[var(--ui-text-muted)]">Max {group.maxSelected}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.options.filter((option) => option.isAvailable).map((option) => {
                const selected = draftItem.selectedModifiers.some((selection) => (
                  (selection.optionId && selection.optionId === option.id)
                  || selection.optionName === option.name
                ));
                return (
                  <button
                    key={`${group.id ?? group.name}:${option.id ?? option.name}`}
                    type="button"
                    onClick={() => onModifierToggle(draftItem.draftId, group, option)}
                    className={cn(
                      'min-h-10 rounded-[var(--ui-radius-md)] border px-3 py-2 text-sm font-semibold transition-colors',
                      selected
                        ? 'border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] text-[var(--ui-accent)]'
                        : 'border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-hover)]',
                    )}
                  >
                    {option.name}
                    {option.priceDeltaCents > 0 ? (
                      <span className="ml-1 text-xs text-[var(--ui-text-muted)]">+{money(option.priceDeltaCents)}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <section className="flex flex-col gap-2">
          <label className="text-sm font-semibold" htmlFor="kassa-selected-line-note">Radnotering</label>
          <Input
            id="kassa-selected-line-note"
            value={draftItem.note ?? ''}
            onChange={(event) => onNoteChange(draftItem.draftId, event.target.value)}
            placeholder="T.ex. utan lök, extra rostad"
            maxLength={500}
          />
        </section>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-[var(--ui-border)] p-3">
        <div>
          <p className="text-xs text-[var(--ui-text-muted)]">Radpris</p>
          <p className="text-lg font-semibold tabular-nums">{money(draftItem.unitPriceCents)}</p>
        </div>
        <div className="flex h-10 items-center overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--ui-border)]">
          <button type="button" className="grid size-10 place-items-center" onClick={() => onQuantityChange(draftItem.draftId, -1)} aria-label="Minska antal">
            <Minus size={16} strokeWidth={1.75} />
          </button>
          <span className="w-10 text-center text-sm font-semibold tabular-nums">{draftItem.quantity}</span>
          <button type="button" className="grid size-10 place-items-center" onClick={() => onQuantityChange(draftItem.draftId, 1)} aria-label="Öka antal">
            <Plus size={16} strokeWidth={1.75} />
          </button>
        </div>
      </footer>
    </aside>
  );
}

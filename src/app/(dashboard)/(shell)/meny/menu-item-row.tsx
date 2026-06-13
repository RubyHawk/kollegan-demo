'use client';

import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { StatusBadge } from '@shared/ui/status-badge';
import { InlineAlert } from '@shared/ui/inline-alert';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { EditIcon, TrashIcon } from '@shared/ui/icons';
import type { RestaurantMenuItem, UpdateMenuItemPayload } from '@shared/lib/api/restaurant.api';
import { priceSummary } from './menu-utils';
import { MenuItemEditorDialog, type MenuItemDraft } from './menu-item-editor-dialog';

interface MenuItemRowProps {
  item: RestaurantMenuItem;
  categoryName: string;
  onUpdate: (id: string, payload: UpdateMenuItemPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function ingredientLabel(quantity: string | null, unit: string | null): string {
  return [quantity, unit].filter(Boolean).join(' ');
}

export function MenuItemRow({ item, categoryName, onUpdate, onDelete }: MenuItemRowProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  async function saveDraft(draft: MenuItemDraft) {
    await onUpdate(item.id, draft);
  }

  async function toggleAvailable() {
    setBusy(true);
    setError('');
    try {
      await onUpdate(item.id, { isAvailable: !item.isAvailable });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    setError('');
    try {
      await onDelete(item.id);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  return (
    <article className="grid gap-2 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-[var(--ui-text)]">{item.name}</p>
            {!item.isAvailable ? <StatusBadge tone="neutral">Dold</StatusBadge> : null}
          </div>
          {item.description ? <p className="text-sm text-[var(--ui-text-muted)]">{item.description}</p> : null}
        </div>
        <p className="shrink-0 text-right text-sm tabular-nums text-[var(--ui-text-secondary)]">
          {priceSummary(item.priceCents, item.currency, item.tags)}
        </p>
      </div>

      {item.ingredients.length > 0 ? (
        <ul className="space-y-1.5 pt-0.5">
          {item.ingredients.map((ingredient, index) => {
            const label = ingredientLabel(ingredient.quantity, ingredient.unit);
            return (
              <li key={`${ingredient.name}-${index}`} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--ui-accent-subtle)] text-[var(--ui-accent-active)]">
                  <UtensilsCrossed size={12} strokeWidth={2} />
                </span>
                <span className="text-sm text-[var(--ui-text)]">
                  {label ? <span className="font-semibold">{label} </span> : null}
                  {ingredient.name}
                  {ingredient.note ? <span className="text-[var(--ui-text-muted)]"> · {ingredient.note}</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {item.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span key={tag} className="rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] px-1.5 py-0.5 text-xs text-[var(--ui-text-muted)]">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1">
        <Button type="button" variant="ghost" size="compact" onClick={() => setEditorOpen(true)}>
          <EditIcon size={14} />
          Redigera
        </Button>
        <Button type="button" variant="ghost" size="compact" loading={busy} onClick={toggleAvailable}>
          {item.isAvailable ? 'Dölj' : 'Visa'}
        </Button>
        <Button type="button" variant="ghost" size="compact" onClick={() => setConfirmOpen(true)}>
          <TrashIcon size={14} />
          Ta bort
        </Button>
      </div>

      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

      <MenuItemEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        item={item}
        categoryName={categoryName}
        onSubmit={saveDraft}
      />

      <ConfirmDestructiveDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Ta bort ${item.name}?`}
        description="Rätten tas bort från menyn och den publika restaurangsidan. Detta går inte att ångra."
        loading={busy}
        onConfirm={confirmDelete}
      />
    </article>
  );
}

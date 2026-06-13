'use client';

import { useState } from 'react';
import { Panel } from '@shared/ui/panel';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import { InlineAlert } from '@shared/ui/inline-alert';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import { EditIcon, PlusIcon, TrashIcon } from '@shared/ui/icons';
import type {
  CreateMenuItemPayload,
  RestaurantMenuCategory,
  UpdateMenuCategoryPayload,
  UpdateMenuItemPayload,
} from '@shared/lib/api/restaurant.api';
import { MenuItemRow } from './menu-item-row';
import { parsePriceCents, parseTags } from './menu-utils';

interface MenuCategoryCardProps {
  category: RestaurantMenuCategory;
  onUpdateCategory: (id: string, payload: UpdateMenuCategoryPayload) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onCreateItem: (categoryId: string, payload: Omit<CreateMenuItemPayload, 'categoryId'>) => Promise<void>;
  onUpdateItem: (id: string, payload: UpdateMenuItemPayload) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export function MenuCategoryCard({
  category,
  onUpdateCategory,
  onDeleteCategory,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
}: MenuCategoryCardProps) {
  const [editingCategory, setEditingCategory] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    if (!name) {
      setError('Kategorin behöver ett namn.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onUpdateCategory(category.id, {
        name,
        description: String(form.get('description') ?? '').trim() || null,
      });
      setEditingCategory(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function addItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const name = String(form.get('name') ?? '').trim();
    if (!name) {
      setError('Rätten behöver ett namn.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onCreateItem(category.id, {
        name,
        priceCents: parsePriceCents(form.get('price')),
        tags: parseTags(form.get('tags')),
        description: String(form.get('description') ?? '').trim() || null,
      });
      formEl.reset();
      setAddingItem(false);
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
      await onDeleteCategory(category.id);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  return (
    <Panel className="space-y-4">
      {editingCategory ? (
        <form onSubmit={saveCategory} className="space-y-3">
          <Input name="name" defaultValue={category.name} placeholder="Kategorinamn" required />
          <Textarea name="description" defaultValue={category.description ?? ''} placeholder="Kort beskrivning" rows={2} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="compact" loading={busy}>Spara</Button>
            <Button type="button" variant="ghost" size="compact" disabled={busy} onClick={() => { setEditingCategory(false); setError(''); }}>
              Avbryt
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--ui-text)]">{category.name}</h2>
            {category.description ? <p className="mt-0.5 text-sm text-[var(--ui-text-muted)]">{category.description}</p> : null}
            <p className="mt-1 text-xs text-[var(--ui-text-muted)]">{category.items.length} rätter</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button type="button" variant="ghost" size="compact" onClick={() => setEditingCategory(true)}>
              <EditIcon size={14} />
              <span className="sr-only sm:not-sr-only">Redigera</span>
            </Button>
            <Button type="button" variant="ghost" size="compact" onClick={() => setConfirmOpen(true)}>
              <TrashIcon size={14} />
              <span className="sr-only sm:not-sr-only">Ta bort</span>
            </Button>
          </div>
        </div>
      )}

      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

      <div className="divide-y divide-[var(--ui-border-subtle)] border-t border-[var(--ui-border-subtle)]">
        {category.items.length === 0 ? (
          <p className="py-3 text-sm text-[var(--ui-text-muted)]">Inga rätter ännu — lägg till den första nedan.</p>
        ) : (
          category.items.map((item) => (
            <MenuItemRow key={item.id} item={item} onUpdate={onUpdateItem} onDelete={onDeleteItem} />
          ))
        )}
      </div>

      {addingItem ? (
        <form onSubmit={addItem} className="space-y-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-3">
          <Input name="name" placeholder="Rättens namn" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="price" type="number" min="0" step="1" placeholder="Pris i kronor" />
            <Input name="tags" placeholder="Prisvarianter, ex. S 89, M 149" />
          </div>
          <Textarea name="description" placeholder="Beskrivning, råvaror eller allergener" rows={3} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="compact" loading={busy}>Lägg till rätt</Button>
            <Button type="button" variant="ghost" size="compact" disabled={busy} onClick={() => { setAddingItem(false); setError(''); }}>
              Avbryt
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="secondary" size="compact" onClick={() => setAddingItem(true)}>
          <PlusIcon size={14} />
          Lägg till rätt
        </Button>
      )}

      <ConfirmDestructiveDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Ta bort ${category.name}?`}
        description="Kategorin och alla dess rätter tas bort från menyn och den publika sidan. Detta går inte att ångra."
        loading={busy}
        onConfirm={confirmDelete}
      />
    </Panel>
  );
}

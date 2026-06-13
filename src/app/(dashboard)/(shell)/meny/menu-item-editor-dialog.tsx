'use client';

import { useState } from 'react';
import { Plus, Sparkles, Trash2, UtensilsCrossed } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ModalActionFooter,
  ModalBody,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import { InlineAlert } from '@shared/ui/inline-alert';
import type { MenuItemIngredientInput, RestaurantMenuItem } from '@shared/lib/api/restaurant.api';
import { parsePriceCents, parseTags, priceToInput } from './menu-utils';

export interface MenuItemDraft {
  name: string;
  priceCents: number | null;
  tags: string[];
  description: string | null;
  ingredients: MenuItemIngredientInput[];
}

interface DraftIngredient {
  key: string;
  quantity: string;
  unit: string;
  name: string;
  note: string;
}

interface MenuItemEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing item to edit; omit for a brand-new item. */
  item?: RestaurantMenuItem;
  categoryName: string;
  onSubmit: (draft: MenuItemDraft) => Promise<void>;
}

function makeKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function emptyRow(): DraftIngredient {
  return { key: makeKey(), quantity: '', unit: '', name: '', note: '' };
}

function toDraftRows(item?: RestaurantMenuItem): DraftIngredient[] {
  if (!item || item.ingredients.length === 0) return [emptyRow()];
  return item.ingredients.map((ingredient) => ({
    key: makeKey(),
    quantity: ingredient.quantity ?? '',
    unit: ingredient.unit ?? '',
    name: ingredient.name,
    note: ingredient.note ?? '',
  }));
}

export function MenuItemEditorDialog({ open, onOpenChange, item, categoryName, onSubmit }: MenuItemEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileVariant="sheet" size="lg" showMobileClose className="flex max-h-[90dvh] flex-col p-0">
        {/* Mounted only while open, so each open re-seeds the form from `item`. */}
        <EditorForm item={item} categoryName={categoryName} onSubmit={onSubmit} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

interface EditorFormProps {
  item?: RestaurantMenuItem;
  categoryName: string;
  onSubmit: (draft: MenuItemDraft) => Promise<void>;
  onClose: () => void;
}

function EditorForm({ item, categoryName, onSubmit, onClose }: EditorFormProps) {
  const isEdit = Boolean(item);
  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(priceToInput(item?.priceCents ?? null));
  const [tags, setTags] = useState(item?.tags.join(', ') ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [rows, setRows] = useState<DraftIngredient[]>(() => toDraftRows(item));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function updateRow(key: string, patch: Partial<DraftIngredient>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((current) => [...current, emptyRow()]);
  }

  function removeRow(key: string) {
    setRows((current) => {
      const next = current.filter((row) => row.key !== key);
      return next.length > 0 ? next : [emptyRow()];
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Rätten behöver ett namn.');
      return;
    }
    const ingredients: MenuItemIngredientInput[] = rows
      .filter((row) => row.name.trim())
      .map((row) => ({
        name: row.name.trim(),
        quantity: row.quantity.trim() || null,
        unit: row.unit.trim() || null,
        note: row.note.trim() || null,
      }));

    setBusy(true);
    setError('');
    try {
      await onSubmit({
        name: trimmedName,
        priceCents: parsePriceCents(price),
        tags: parseTags(tags),
        description: description.trim() || null,
        ingredients,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="border-b border-[var(--ui-border)] text-left">
        <DialogTitle>{isEdit ? 'Redigera rätt' : 'Ny rätt'}</DialogTitle>
        <DialogDescription>{categoryName}</DialogDescription>
      </DialogHeader>

      <ModalBody className="space-y-6">
        <section className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="item-name" className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">Namn</label>
            <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Italiano sub" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="item-price" className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">Pris (kr)</label>
              <Input id="item-price" type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Lämna tomt för prisvarianter" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="item-tags" className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">Prisvarianter</label>
              <Input id="item-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Ex. S 89, M 149, L 239" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="item-desc" className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">Beskrivning</label>
            <Textarea id="item-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kort beskrivning, råvaror eller allergener" rows={2} />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--ui-text)]">
              <Sparkles size={15} strokeWidth={2} className="text-[var(--ui-accent)]" />
              Ingredienser
            </h3>
            <span className="text-xs text-[var(--ui-text-muted)]">{rows.filter((r) => r.name.trim()).length} st</span>
          </div>

          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.key} className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ui-accent-subtle)] text-[var(--ui-accent-active)]">
                    <UtensilsCrossed size={13} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="grid grid-cols-[4.5rem_5.5rem_1fr] gap-2">
                      <Input aria-label="Mängd" value={row.quantity} onChange={(e) => updateRow(row.key, { quantity: e.target.value })} placeholder="2" />
                      <Input aria-label="Enhet" value={row.unit} onChange={(e) => updateRow(row.key, { unit: e.target.value })} placeholder="dl" />
                      <Input aria-label="Ingrediens" value={row.name} onChange={(e) => updateRow(row.key, { name: e.target.value })} placeholder="Ingrediens" />
                    </div>
                    <Input aria-label="Anteckning" value={row.note} onChange={(e) => updateRow(row.key, { note: e.target.value })} placeholder="Anteckning, ex. färsk eller fryst (valfritt)" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    aria-label="Ta bort ingrediens"
                    className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--ui-radius-sm)] text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-danger-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
                  >
                    <Trash2 size={15} strokeWidth={1.75} />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <Button type="button" variant="secondary" size="compact" onClick={addRow}>
            <Plus size={14} />
            Lägg till ingrediens
          </Button>
        </section>

        {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
      </ModalBody>

      <ModalActionFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
          Avbryt
        </Button>
        <Button type="submit" loading={busy} className="sm:w-auto">
          {isEdit ? 'Spara ändringar' : 'Lägg till rätt'}
        </Button>
      </ModalActionFooter>
    </form>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Minus, Plus, Search, Trash2 } from 'lucide-react';
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
import { InlineAlert } from '@shared/ui/inline-alert';
import type {
  CatalogIngredient,
  CreateIngredientPayload,
  IngredientCatalog,
  MenuItemIngredientInput,
  RestaurantMenuItem,
} from '@shared/lib/api/restaurant.api';
import { parsePriceCents, parseTags, priceToInput } from './menu-utils';
import { COMMON_UNITS, guessEmoji } from './menu-ingredient-palette';

const CUSTOM_CATEGORY_ID = 'other';

export interface MenuItemDraft {
  name: string;
  priceCents: number | null;
  tags: string[];
  description: string | null;
  ingredients: MenuItemIngredientInput[];
}

interface DraftIngredient {
  key: string;
  ingredientId: string | null;
  emoji: string;
  name: string;
  quantity: string;
  unit: string;
  note: string;
}

interface MenuItemEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: RestaurantMenuItem;
  categoryName: string;
  catalog: IngredientCatalog;
  onCreateIngredient: (payload: CreateIngredientPayload) => Promise<CatalogIngredient>;
  onSubmit: (draft: MenuItemDraft) => Promise<void>;
}

function makeKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function toDraftRows(item?: RestaurantMenuItem): DraftIngredient[] {
  if (!item) return [];
  return item.ingredients.map((ingredient) => ({
    key: makeKey(),
    ingredientId: ingredient.ingredientId,
    emoji: ingredient.emoji ?? guessEmoji(ingredient.name),
    name: ingredient.name,
    quantity: ingredient.quantity ?? '',
    unit: ingredient.unit ?? '',
    note: ingredient.note ?? '',
  }));
}

function amountLabel(row: DraftIngredient): string {
  return [row.quantity, row.unit].filter(Boolean).join(' ');
}

export function MenuItemEditorDialog(props: MenuItemEditorDialogProps) {
  const { open, onOpenChange } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileVariant="sheet" size="lg" showMobileClose className="flex max-h-[92dvh] flex-col p-0">
        {/* Mounted only while open, so each open re-seeds the form from `item`. */}
        <EditorForm {...props} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

interface EditorFormProps extends MenuItemEditorDialogProps {
  onClose: () => void;
}

function EditorForm({ item, categoryName, catalog, onCreateIngredient, onSubmit, onClose }: EditorFormProps) {
  const isEdit = Boolean(item);
  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(priceToInput(item?.priceCents ?? null));
  const [tags, setTags] = useState(item?.tags.join(', ') ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [rows, setRows] = useState<DraftIngredient[]>(() => toDraftRows(item));
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const activeRow = rows.find((row) => row.key === activeKey) ?? null;

  const groups = useMemo(() => {
    const byCategory = new Map<string, CatalogIngredient[]>();
    for (const ingredient of catalog.ingredients) {
      const list = byCategory.get(ingredient.categoryId) ?? [];
      list.push(ingredient);
      byCategory.set(ingredient.categoryId, list);
    }
    return catalog.categories
      .map((category) => ({ category, items: byCategory.get(category.id) ?? [] }))
      .filter((group) => group.items.length > 0);
  }, [catalog]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return catalog.ingredients.filter((ingredient) =>
      ingredient.name.toLowerCase().includes(q) ||
      ingredient.aliases.some((alias) => alias.toLowerCase().includes(q)),
    );
  }, [query, catalog]);

  function patchRow(key: string, patch: Partial<DraftIngredient>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addCatalogIngredient(ingredient: CatalogIngredient) {
    const existing = rows.find((row) => row.ingredientId === ingredient.id);
    if (existing) {
      setActiveKey(existing.key);
      return;
    }
    const key = makeKey();
    setRows((current) => [
      ...current,
      {
        key,
        ingredientId: ingredient.id,
        emoji: ingredient.emoji ?? guessEmoji(ingredient.name),
        name: ingredient.name,
        quantity: '1',
        unit: ingredient.defaultUnit ?? '',
        note: '',
      },
    ]);
    setActiveKey(key);
  }

  async function addCustom() {
    const seed = query.trim();
    if (!seed) return;
    setCreating(true);
    setError('');
    try {
      const ingredient = await onCreateIngredient({ categoryId: CUSTOM_CATEGORY_ID, name: seed, emoji: guessEmoji(seed) });
      addCatalogIngredient(ingredient);
      setQuery('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key));
    setActiveKey((current) => (current === key ? null : current));
  }

  function stepAmount(key: string, delta: number) {
    const row = rows.find((entry) => entry.key === key);
    if (!row) return;
    const current = Number.parseFloat(row.quantity.replace(',', '.'));
    const base = Number.isFinite(current) ? current : 0;
    const next = Math.max(0, Math.round((base + delta) * 100) / 100);
    patchRow(key, { quantity: String(next) });
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
        ingredientId: row.ingredientId,
        emoji: row.emoji || null,
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

  const unitOptions = activeRow && activeRow.unit && !COMMON_UNITS.includes(activeRow.unit)
    ? [activeRow.unit, ...COMMON_UNITS]
    : COMMON_UNITS;

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="border-b border-[var(--ui-border)] text-left">
        <DialogTitle>{isEdit ? 'Bygg rätten' : 'Ny rätt'}</DialogTitle>
        <DialogDescription>{categoryName}</DialogDescription>
      </DialogHeader>

      <ModalBody className="space-y-6">
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Namnge rätten…"
            aria-label="Rättens namn"
            required
            className="w-full bg-transparent text-2xl font-semibold tracking-tight text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-1.5">
              <span className="text-[var(--ui-text-muted)]">Pris</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
                placeholder="—"
                aria-label="Pris i kronor"
                className="w-16 bg-transparent text-right font-semibold text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:outline-none"
              />
              <span className="text-[var(--ui-text-muted)]">kr</span>
            </div>
            <div className="inline-flex flex-1 items-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-1.5">
              <span className="whitespace-nowrap text-[var(--ui-text-muted)]">Varianter</span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="t.ex. S 89, M 149"
                aria-label="Prisvarianter"
                className="min-w-0 flex-1 bg-transparent text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--ui-text)]">I rätten</h3>
            <span className="text-xs text-[var(--ui-text-muted)]">{rows.length} ingredienser</span>
          </div>

          {rows.length === 0 ? (
            <p className="rounded-[var(--ui-radius-md)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-4 py-6 text-center text-sm text-[var(--ui-text-muted)]">
              Tryck på ingredienserna nedan för att bygga rätten 👇
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {rows.map((row) => {
                const active = row.key === activeKey;
                const label = amountLabel(row);
                return (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => setActiveKey(active ? null : row.key)}
                    className={[
                      'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors',
                      active
                        ? 'border-[var(--ui-accent)] bg-[var(--ui-accent-subtle)] text-[var(--ui-text)] ring-1 ring-[var(--ui-accent)]'
                        : 'border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-hover)]',
                    ].join(' ')}
                  >
                    <span className="text-lg leading-none">{row.emoji}</span>
                    <span className="font-medium">{row.name || 'Ny ingrediens'}</span>
                    {label ? <span className="text-xs text-[var(--ui-text-muted)]">{label}</span> : null}
                  </button>
                );
              })}
            </div>
          )}

          {activeRow ? (
            <div className="space-y-3 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-3">
              <div className="flex items-center gap-2">
                <span className="text-xl leading-none">{activeRow.emoji}</span>
                <input
                  value={activeRow.name}
                  onChange={(e) => patchRow(activeRow.key, { name: e.target.value })}
                  placeholder="Ingrediensens namn"
                  aria-label="Ingrediensens namn"
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeRow(activeRow.key)}
                  aria-label="Ta bort ingrediens"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-danger-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
                >
                  <Trash2 size={16} strokeWidth={1.75} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] p-1">
                  <button type="button" onClick={() => stepAmount(activeRow.key, -1)} aria-label="Minska" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--ui-text)] hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]">
                    <Minus size={16} />
                  </button>
                  <input
                    value={activeRow.quantity}
                    onChange={(e) => patchRow(activeRow.key, { quantity: e.target.value })}
                    inputMode="decimal"
                    aria-label="Mängd"
                    className="w-12 bg-transparent text-center text-sm font-semibold text-[var(--ui-text)] focus:outline-none"
                    placeholder="–"
                  />
                  <button type="button" onClick={() => stepAmount(activeRow.key, 1)} aria-label="Öka" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--ui-text)] hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]">
                    <Plus size={16} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {unitOptions.map((unit) => {
                    const selected = activeRow.unit === unit;
                    return (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => patchRow(activeRow.key, { unit: selected ? '' : unit })}
                        className={[
                          'rounded-full border px-2.5 py-1 text-xs transition-colors',
                          selected
                            ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)] text-[var(--ui-text-inverse)]'
                            : 'border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-hover)]',
                        ].join(' ')}
                      >
                        {unit}
                      </button>
                    );
                  })}
                </div>
              </div>

              <input
                value={activeRow.note}
                onChange={(e) => patchRow(activeRow.key, { note: e.target.value })}
                placeholder="Anteckning, t.ex. färsk eller fryst (valfritt)"
                aria-label="Anteckning"
                className="w-full rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
              />
            </div>
          ) : null}
        </section>

        {/* Catalog picker — tap to add from the shared ingredient library */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3">
            <Search size={16} className="shrink-0 text-[var(--ui-text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök bland alla ingredienser…"
              aria-label="Sök ingrediens"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:outline-none"
            />
            {query.trim() ? (
              <button type="button" disabled={creating} onClick={addCustom} className="shrink-0 whitespace-nowrap rounded-full bg-[var(--ui-accent-subtle)] px-3 py-1 text-xs font-semibold text-[var(--ui-accent-active)] hover:bg-[var(--ui-surface-hover)] disabled:opacity-60">
                {creating ? 'Lägger till…' : `+ Lägg till “${query.trim()}”`}
              </button>
            ) : null}
          </div>

          {matches ? (
            matches.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {matches.map((ingredient) => (
                  <PaletteTile key={ingredient.id} ingredient={ingredient} onAdd={addCatalogIngredient} />
                ))}
              </div>
            ) : (
              <p className="rounded-[var(--ui-radius-md)] border border-dashed border-[var(--ui-border)] px-4 py-3 text-center text-sm text-[var(--ui-text-muted)]">
                Hittade ingen träff — tryck “+ Lägg till” för att spara den som egen ingrediens.
              </p>
            )
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.category.id} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
                    {group.category.emoji ? `${group.category.emoji} ` : ''}{group.category.name}
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {group.items.map((ingredient) => (
                      <PaletteTile key={ingredient.id} ingredient={ingredient} onAdd={addCatalogIngredient} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-1.5">
          <label htmlFor="item-desc" className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">Beskrivning för gästen (valfritt)</label>
          <textarea
            id="item-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Säljande text som visas på menyn"
            rows={2}
            className="w-full rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
          />
        </div>

        {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
      </ModalBody>

      <ModalActionFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
          Avbryt
        </Button>
        <Button type="submit" loading={busy} className="sm:w-auto">
          {isEdit ? 'Spara rätten' : 'Lägg till rätt'}
        </Button>
      </ModalActionFooter>
    </form>
  );
}

function PaletteTile({ ingredient, onAdd }: { ingredient: CatalogIngredient; onAdd: (ingredient: CatalogIngredient) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAdd(ingredient)}
      className="flex flex-col items-center gap-1 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-2.5 text-center transition-colors hover:border-[var(--ui-accent-border)] hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
    >
      <span className="text-2xl leading-none">{ingredient.emoji ?? guessEmoji(ingredient.name)}</span>
      <span className="text-xs leading-tight text-[var(--ui-text)]">{ingredient.name}</span>
    </button>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Minus, Plus, Search, Trash2, X } from 'lucide-react';
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
import { isPriceTag, parsePriceCents, parseVariantTag, priceToInput } from './menu-utils';
import { PRIMARY_UNITS, POPULAR_INGREDIENTS, guessEmoji } from './menu-ingredient-palette';

const CUSTOM_CATEGORY_ID = 'other';
const POPULAR_TAB = '__popular__';

const SIZE_PRESETS: Array<{ name: string; labels: string[] }> = [
  { name: 'S / M / L', labels: ['S', 'M', 'L'] },
  { name: 'Liten / Mellan / Stor', labels: ['Liten', 'Mellan', 'Stor'] },
];

export interface MenuItemDraft {
  name: string;
  priceCents: number | null;
  tags: string[];
  description: string | null;
  ingredients: MenuItemIngredientInput[];
}

type PriceMode = 'single' | 'sizes';

interface SizeRow {
  key: string;
  label: string;
  price: string;
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

// Only price-variant tags ("S 89") become size rows; badge tags ("Glutenfri")
// are kept aside and preserved on save (see menu-utils + public menu parser).
function toSizeRows(item?: RestaurantMenuItem): SizeRow[] {
  if (!item) return [];
  return item.tags.filter(isPriceTag).map((tag) => ({ key: makeKey(), ...parseVariantTag(tag) }));
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
      <DialogContent mobileVariant="sheet" size="lg" showMobileClose className="flex max-h-[94dvh] flex-col p-0">
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
  const [priceMode, setPriceMode] = useState<PriceMode>(() => (item?.tags.some(isPriceTag) ? 'sizes' : 'single'));
  const [singlePrice, setSinglePrice] = useState(priceToInput(item?.priceCents ?? null));
  const [sizes, setSizes] = useState<SizeRow[]>(() => toSizeRows(item));
  // Non-price tags (e.g. "Glutenfri") carry through untouched so editing never drops them.
  const [badgeTags] = useState<string[]>(() => (item?.tags ?? []).filter((tag) => !isPriceTag(tag)));
  const [description, setDescription] = useState(item?.description ?? '');
  const [rows, setRows] = useState<DraftIngredient[]>(() => toDraftRows(item));
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(POPULAR_TAB);
  const [noteOpenKey, setNoteOpenKey] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const activeRow = rows.find((row) => row.key === activeKey) ?? null;

  const byCategory = useMemo(() => {
    const map = new Map<string, CatalogIngredient[]>();
    for (const ingredient of catalog.ingredients) {
      const list = map.get(ingredient.categoryId) ?? [];
      list.push(ingredient);
      map.set(ingredient.categoryId, list);
    }
    return map;
  }, [catalog]);

  const popular = useMemo(() => {
    const byName = new Map(catalog.ingredients.map((ingredient) => [ingredient.name.toLowerCase(), ingredient] as const));
    return POPULAR_INGREDIENTS
      .map((name) => byName.get(name.toLowerCase()))
      .filter((ingredient): ingredient is CatalogIngredient => Boolean(ingredient));
  }, [catalog]);

  // One tab per non-empty category, with a curated "Populära" tab first — so the
  // picker shows ~20 tiles at a time instead of the entire 1000+ catalog.
  const tabs = useMemo(() => {
    const withItems = catalog.categories.filter((category) => (byCategory.get(category.id)?.length ?? 0) > 0);
    return [
      ...(popular.length > 0 ? [{ id: POPULAR_TAB, name: 'Populära', emoji: '⭐' }] : []),
      ...withItems.map((category) => ({ id: category.id, name: category.name, emoji: category.emoji })),
    ];
  }, [catalog, byCategory, popular]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return catalog.ingredients.filter((ingredient) =>
      ingredient.name.toLowerCase().includes(q) ||
      ingredient.aliases.some((alias) => alias.toLowerCase().includes(q)),
    );
  }, [query, catalog]);

  // ── Sizes & price ──────────────────────────────────────────────────────────
  function addSize(label = '') {
    setSizes((current) => [...current, { key: makeKey(), label, price: '' }]);
  }
  function updateSize(key: string, patch: Partial<SizeRow>) {
    setSizes((current) => current.map((size) => (size.key === key ? { ...size, ...patch } : size)));
  }
  function removeSize(key: string) {
    setSizes((current) => current.filter((size) => size.key !== key));
  }
  function applyPreset(labels: string[]) {
    setSizes((current) => {
      const seen = new Set(current.map((size) => size.label.trim().toLowerCase()));
      const additions = labels
        .filter((label) => !seen.has(label.toLowerCase()))
        .map((label) => ({ key: makeKey(), label, price: '' }));
      return [...current, ...additions];
    });
  }

  // ── Ingredients ──────────────────────────────────────────────────────────
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

  function fillDescriptionFromContents() {
    const text = rows.map((row) => row.name.trim()).filter(Boolean).join(', ');
    if (text) setDescription(text);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Rätten behöver ett namn.');
      return;
    }

    let priceCents: number | null = null;
    let tags: string[] = [...badgeTags];
    if (priceMode === 'single') {
      priceCents = parsePriceCents(singlePrice);
    } else {
      const sizeTags = sizes
        .filter((size) => size.label.trim())
        .map((size) => {
          const price = size.price.trim();
          return price ? `${size.label.trim()} ${price}` : size.label.trim();
        });
      tags = [...sizeTags, ...badgeTags];
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
      await onSubmit({ name: trimmedName, priceCents, tags, description: description.trim() || null, ingredients });
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const unitOptions = activeRow && activeRow.unit && !PRIMARY_UNITS.includes(activeRow.unit)
    ? [activeRow.unit, ...PRIMARY_UNITS]
    : PRIMARY_UNITS;

  const currentTab = tabs.find((tab) => tab.id === activeCategory) ?? tabs[0] ?? null;
  const browseTiles = !currentTab
    ? []
    : currentTab.id === POPULAR_TAB
      ? popular
      : byCategory.get(currentTab.id) ?? [];

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="border-b border-[var(--ui-border)] text-left">
        <DialogTitle>{isEdit ? 'Redigera rätt' : 'Ny rätt'}</DialogTitle>
        <DialogDescription>{categoryName}</DialogDescription>
      </DialogHeader>

      <ModalBody className="space-y-6">
        {/* ── Namn ── */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Namnge rätten…"
          aria-label="Rättens namn"
          required
          className="w-full bg-transparent text-2xl font-semibold tracking-tight text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:outline-none"
        />

        {/* ── Storlek & pris ── */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--ui-text)]">Storlek &amp; pris</h3>
            <div className="inline-flex rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-0.5">
              {(['single', 'sizes'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPriceMode(mode)}
                  className={[
                    'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                    priceMode === mode
                      ? 'bg-[var(--ui-accent)] text-[var(--ui-text-inverse)]'
                      : 'text-[var(--ui-text-secondary)] hover:text-[var(--ui-text)]',
                  ].join(' ')}
                >
                  {mode === 'single' ? 'Ett pris' : 'Flera storlekar'}
                </button>
              ))}
            </div>
          </div>

          {priceMode === 'single' ? (
            <label className="flex w-full items-center gap-2 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2.5 sm:w-60">
              <span className="text-sm text-[var(--ui-text-muted)]">Pris</span>
              <input
                value={singlePrice}
                onChange={(e) => setSinglePrice(e.target.value)}
                inputMode="numeric"
                placeholder="0"
                aria-label="Pris i kronor"
                className="min-w-0 flex-1 bg-transparent text-right text-base font-semibold text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:outline-none"
              />
              <span className="text-sm text-[var(--ui-text-muted)]">kr</span>
            </label>
          ) : (
            <div className="space-y-2">
              {sizes.map((size) => (
                <div key={size.key} className="flex items-center gap-2">
                  <input
                    value={size.label}
                    onChange={(e) => updateSize(size.key, { label: e.target.value })}
                    placeholder="Storlek"
                    aria-label="Storlek"
                    className="w-20 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2.5 text-sm font-medium text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] sm:w-32"
                  />
                  <label className="flex flex-1 items-center gap-1.5 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2.5">
                    <input
                      value={size.price}
                      onChange={(e) => updateSize(size.key, { price: e.target.value })}
                      inputMode="numeric"
                      placeholder="0"
                      aria-label={`Pris för ${size.label || 'storlek'}`}
                      className="min-w-0 flex-1 bg-transparent text-right text-sm font-semibold text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:outline-none"
                    />
                    <span className="text-sm text-[var(--ui-text-muted)]">kr</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeSize(size.key)}
                    aria-label="Ta bort storlek"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-danger-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => addSize()}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-surface-hover)]"
                >
                  <Plus size={14} />
                  Lägg till storlek
                </button>
                {sizes.length === 0
                  ? SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset.labels)}
                      className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1.5 text-xs text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-hover)]"
                    >
                      {preset.name}
                    </button>
                  ))
                  : null}
              </div>
            </div>
          )}
        </section>

        {/* ── Innehåll (ingredients) ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--ui-text)]">Innehåll</h3>
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

              {activeRow.note.trim() || noteOpenKey === activeRow.key ? (
                <input
                  value={activeRow.note}
                  onChange={(e) => patchRow(activeRow.key, { note: e.target.value })}
                  placeholder="Anteckning, t.ex. färsk eller fryst"
                  aria-label="Anteckning"
                  autoFocus={noteOpenKey === activeRow.key}
                  className="w-full rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setNoteOpenKey(activeRow.key)}
                  className="self-start text-xs font-semibold text-[var(--ui-accent-active)] hover:underline"
                >
                  + Anteckning
                </button>
              )}
            </div>
          ) : null}

          {/* Catalog picker — tap to add from the shared ingredient library */}
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
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {matches.map((ingredient) => (
                  <PaletteTile key={ingredient.id} ingredient={ingredient} onAdd={addCatalogIngredient} />
                ))}
              </div>
            ) : (
              <p className="rounded-[var(--ui-radius-lg)] border border-dashed border-[var(--ui-border)] px-4 py-3 text-center text-sm text-[var(--ui-text-muted)]">
                Hittade ingen träff — tryck “+ Lägg till” för att spara den som egen ingrediens.
              </p>
            )
          ) : (
            <div className="space-y-3">
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {tabs.map((tab) => {
                  const selected = currentTab?.id === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCategory(tab.id)}
                      className={[
                        'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        selected
                          ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)] text-[var(--ui-text-inverse)]'
                          : 'border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-hover)]',
                      ].join(' ')}
                    >
                      {tab.emoji ? `${tab.emoji} ` : ''}{tab.name}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {browseTiles.map((ingredient) => (
                  <PaletteTile key={ingredient.id} ingredient={ingredient} onAdd={addCatalogIngredient} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Beskrivning ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="item-desc" className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">Beskrivning för gästen (valfritt)</label>
            {rows.length > 0 && !description.trim() ? (
              <button type="button" onClick={fillDescriptionFromContents} className="text-xs font-semibold text-[var(--ui-accent-active)] hover:underline">
                Fyll i från innehåll
              </button>
            ) : null}
          </div>
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
      className="flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-2 text-center transition-colors hover:border-[var(--ui-accent-border)] hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
    >
      <span className="text-2xl leading-none">{ingredient.emoji ?? guessEmoji(ingredient.name)}</span>
      <span className="line-clamp-2 text-[11px] leading-tight text-[var(--ui-text)]">{ingredient.name}</span>
    </button>
  );
}

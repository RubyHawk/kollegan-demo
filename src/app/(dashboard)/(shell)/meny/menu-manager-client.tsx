'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';
import { InlineAlert } from '@shared/ui/inline-alert';
import {
  createRestaurantMenuCategory,
  createRestaurantMenuItem,
  listRestaurantMenu,
  type RestaurantMenuCategory,
} from '@shared/lib/api/restaurant.api';
import { PlusIcon } from '@shared/ui/icons';

function formatPrice(priceCents: number | null, currency: string) {
  if (priceCents == null) return 'Pris saknas';
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(priceCents / 100);
}

function priceSummary(priceCents: number | null, currency: string, tags: string[]) {
  if (priceCents != null) return formatPrice(priceCents, currency);
  return tags.length > 0 ? tags.join(' / ') : 'Pris saknas';
}

export function MenuManagerClient() {
  const [categories, setCategories] = useState<RestaurantMenuCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? categories[0] ?? null,
    [categories, selectedCategoryId],
  );

  async function load() {
    try {
      const next = await listRestaurantMenu();
      setCategories(next);
      setSelectedCategoryId((current) => current && next.some((category) => category.id === current) ? current : next[0]?.id ?? '');
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError('');
    try {
      const category = await createRestaurantMenuCategory({
        name: String(form.get('name') ?? ''),
        description: String(form.get('description') ?? '') || null,
      });
      event.currentTarget.reset();
      setSelectedCategoryId(category.id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const categoryId = String(form.get('categoryId') ?? '');
    setSaving(true);
    setError('');
    try {
      await createRestaurantMenuItem({
        categoryId,
        name: String(form.get('name') ?? ''),
        description: String(form.get('description') ?? '') || null,
        priceCents: Math.round(Number(form.get('price') ?? 0) * 100),
      });
      event.currentTarget.reset();
      setSelectedCategoryId(categoryId);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Restaurang"
        title="Meny"
        description="Hantera kategorier och rätter som visas på den publika restaurangsidan."
      />
      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <Panel className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Ny kategori</h2>
            <form onSubmit={createCategory} className="space-y-3">
              <Input name="name" placeholder="Ex. Förrätter" required />
              <Textarea name="description" placeholder="Kort beskrivning" rows={3} />
              <Button type="submit" loading={saving}>
                <PlusIcon />
                Lägg till kategori
              </Button>
            </form>
          </Panel>

          <Panel className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Ny rätt</h2>
            <form onSubmit={createItem} className="space-y-3">
              <select
                name="categoryId"
                value={selectedCategory?.id ?? ''}
                onChange={(event) => setSelectedCategoryId(event.target.value)}
                className="h-10 w-full rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-sm text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <Input name="name" placeholder="Rättens namn" required />
              <Input name="price" type="number" min="0" step="1" placeholder="Pris i kronor" />
              <Textarea name="description" placeholder="Beskrivning, råvaror eller allergener" rows={4} />
              <Button type="submit" loading={saving} disabled={categories.length === 0}>
                <PlusIcon />
                Lägg till rätt
              </Button>
            </form>
          </Panel>
        </div>

        <Panel className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--ui-text)]">Publicerad meny</h2>
            <button type="button" onClick={() => void load()} className="text-sm font-medium text-[var(--ui-accent)]">Uppdatera</button>
          </div>
          <div className="space-y-5">
            {categories.length === 0 ? (
              <p className="text-sm text-[var(--ui-text-muted)]">Skapa första kategorin för att börja bygga menyn.</p>
            ) : categories.map((category) => (
              <section key={category.id} className="space-y-2 border-t border-[var(--ui-border)] pt-4 first:border-t-0 first:pt-0">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--ui-text)]">{category.name}</h3>
                  {category.description ? <p className="text-xs text-[var(--ui-text-muted)]">{category.description}</p> : null}
                </div>
                <div className="divide-y divide-[var(--ui-border)]">
                  {category.items.length === 0 ? (
                    <p className="py-3 text-sm text-[var(--ui-text-muted)]">Inga rätter ännu.</p>
                  ) : category.items.map((item) => (
                    <article key={item.id} className="grid gap-1 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-[var(--ui-text)]">{item.name}</p>
                        <p className="text-right text-sm tabular-nums text-[var(--ui-text-secondary)]">{priceSummary(item.priceCents, item.currency, item.tags)}</p>
                      </div>
                      {item.description ? <p className="text-sm text-[var(--ui-text-muted)]">{item.description}</p> : null}
                      {item.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {item.tags.map((tag) => (
                            <span key={tag} className="rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] px-1.5 py-0.5 text-xs text-[var(--ui-text-muted)]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

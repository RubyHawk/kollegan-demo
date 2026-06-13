'use client';

import { useEffect, useState } from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';
import { InlineAlert } from '@shared/ui/inline-alert';
import { EmptyState } from '@shared/ui/empty-state';
import { Skeleton } from '@shared/ui/skeleton';
import { PlusIcon } from '@shared/ui/icons';
import {
  createIngredient,
  createRestaurantMenuCategory,
  createRestaurantMenuItem,
  deleteRestaurantMenuCategory,
  deleteRestaurantMenuItem,
  getIngredientCatalog,
  listRestaurantMenu,
  updateRestaurantMenuCategory,
  updateRestaurantMenuItem,
  type CreateIngredientPayload,
  type CreateMenuItemPayload,
  type IngredientCatalog,
  type RestaurantMenuCategory,
  type UpdateMenuCategoryPayload,
  type UpdateMenuItemPayload,
} from '@shared/lib/api/restaurant.api';
import { MenuCategoryCard } from './menu-category-card';
import { OpeningHoursManager } from './opening-hours-manager';

export function MenuManagerClient() {
  const [categories, setCategories] = useState<RestaurantMenuCategory[]>([]);
  const [catalog, setCatalog] = useState<IngredientCatalog>({ categories: [], ingredients: [] });
  const [loading, setLoading] = useState(true);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setCategories(await listRestaurantMenu());
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // The ingredient catalog is large and rarely changes — load it once.
    getIngredientCatalog()
      .then(setCatalog)
      .catch(() => {
        // A catalog failure shouldn't block menu editing; the picker just stays empty.
      });
  }, []);

  async function handleCreateIngredient(payload: CreateIngredientPayload) {
    const ingredient = await createIngredient(payload);
    setCatalog((current) => ({
      ...current,
      ingredients: [...current.ingredients.filter((entry) => entry.id !== ingredient.id), ingredient],
    }));
    return ingredient;
  }

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const name = String(form.get('name') ?? '').trim();
    if (!name) {
      setError('Kategorin behöver ett namn.');
      return;
    }
    setCreatingCategory(true);
    setError('');
    try {
      await createRestaurantMenuCategory({
        name,
        description: String(form.get('description') ?? '').trim() || null,
      });
      formEl.reset();
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreatingCategory(false);
    }
  }

  async function updateCategory(id: string, payload: UpdateMenuCategoryPayload) {
    await updateRestaurantMenuCategory(id, payload);
    await load();
  }

  async function deleteCategory(id: string) {
    await deleteRestaurantMenuCategory(id);
    await load();
  }

  async function createItem(categoryId: string, payload: Omit<CreateMenuItemPayload, 'categoryId'>) {
    await createRestaurantMenuItem({ categoryId, ...payload });
    await load();
  }

  async function updateItem(id: string, payload: UpdateMenuItemPayload) {
    await updateRestaurantMenuItem(id, payload);
    await load();
  }

  async function deleteItem(id: string) {
    await deleteRestaurantMenuItem(id);
    await load();
  }

  const itemCount = categories.reduce((sum, category) => sum + category.items.length, 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Restaurang"
        title="Meny"
        description="Skapa och redigera kategorier och rätter. Ändringarna visas direkt på den publika restaurangsidan."
        meta={
          categories.length > 0
            ? <span className="text-xs text-[var(--ui-text-muted)]">{categories.length} kategorier · {itemCount} rätter</span>
            : undefined
        }
      />

      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

      <Panel className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--ui-text)]">Ny kategori</h2>
        <form onSubmit={createCategory} className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-start">
          <Input name="name" placeholder="Ex. Förrätter" required />
          <Textarea name="description" placeholder="Kort beskrivning (valfritt)" rows={1} className="min-h-10" />
          <Button type="submit" loading={creatingCategory}>
            <PlusIcon size={14} />
            Lägg till
          </Button>
        </form>
      </Panel>

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((row) => (
            <Panel key={row} className="space-y-3" role="status" aria-busy="true">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </Panel>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Panel>
          <EmptyState
            title="Menyn är tom"
            description="Skapa din första kategori ovan för att börja bygga menyn som visas för gästerna."
          />
        </Panel>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <MenuCategoryCard
              key={category.id}
              category={category}
              catalog={catalog}
              onCreateIngredient={handleCreateIngredient}
              onUpdateCategory={updateCategory}
              onDeleteCategory={deleteCategory}
              onCreateItem={createItem}
              onUpdateItem={updateItem}
              onDeleteItem={deleteItem}
            />
          ))}
        </div>
      )}

      <OpeningHoursManager />
    </div>
  );
}

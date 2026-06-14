export interface IngredientCategoryView {
  id: string;
  name: string;
  emoji: string | null;
  sortOrder: number;
}

export interface CatalogIngredientView {
  id: string;
  categoryId: string;
  name: string;
  emoji: string | null;
  defaultUnit: string | null;
  aliases: string[];
  allergens: string[];
  /** True for tenant-added ingredients, false for the shared global library. */
  isCustom: boolean;
}

export interface IngredientCatalog {
  categories: IngredientCategoryView[];
  ingredients: CatalogIngredientView[];
}

export interface CreateIngredientInput {
  categoryId: string;
  name: string;
  emoji?: string | null;
  defaultUnit?: string | null;
  aliases?: string[];
  allergens?: string[];
}

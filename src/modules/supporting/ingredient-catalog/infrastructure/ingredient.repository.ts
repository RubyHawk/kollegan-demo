import { prisma } from '@platform/database/prisma';
import type {
  CatalogIngredientView,
  CreateIngredientInput,
  IngredientCategoryView,
} from '../domain/ingredient.entity';

type IngredientRow = {
  id: string;
  organizationId: string | null;
  categoryId: string;
  name: string;
  emoji: string | null;
  defaultUnit: string | null;
  aliases: string[];
  allergens: string[];
};

const INGREDIENT_SELECT = {
  id: true,
  organizationId: true,
  categoryId: true,
  name: true,
  emoji: true,
  defaultUnit: true,
  aliases: true,
  allergens: true,
} as const;

function mapIngredient(row: IngredientRow): CatalogIngredientView {
  return {
    id: row.id,
    categoryId: row.categoryId,
    name: row.name,
    emoji: row.emoji,
    defaultUnit: row.defaultUnit,
    aliases: row.aliases,
    allergens: row.allergens,
    isCustom: row.organizationId !== null,
  };
}

export function slugifyIngredient(name: string): string {
  return name
    .toLowerCase()
    .replaceAll('å', 'a').replaceAll('ä', 'a').replaceAll('ö', 'o')
    .replaceAll('é', 'e').replaceAll('è', 'e')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const ingredientRepository = {
  async listCategories(): Promise<IngredientCategoryView[]> {
    return prisma.ingredientCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, emoji: true, sortOrder: true },
    });
  },

  // Global library (organizationId NULL) plus this tenant's own custom additions.
  async listIngredients(organizationId: string): Promise<CatalogIngredientView[]> {
    const rows = await prisma.ingredient.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [{ organizationId: null }, { organizationId }],
      },
      orderBy: [{ name: 'asc' }],
      select: INGREDIENT_SELECT,
    });
    return rows.map((row) => mapIngredient(row as IngredientRow));
  },

  async categoryExists(categoryId: string): Promise<boolean> {
    const category = await prisma.ingredientCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    return Boolean(category);
  },

  async createCustomIngredient(
    organizationId: string,
    actorId: string,
    input: CreateIngredientInput,
  ): Promise<CatalogIngredientView> {
    const slug = slugifyIngredient(input.name);
    // Idempotent: reuse an existing custom ingredient with the same slug.
    const existing = await prisma.ingredient.findFirst({
      where: { organizationId, slug, deletedAt: null },
      select: INGREDIENT_SELECT,
    });
    if (existing) return mapIngredient(existing as IngredientRow);

    const row = await prisma.ingredient.create({
      data: {
        organizationId,
        categoryId: input.categoryId,
        slug,
        name: input.name,
        emoji: input.emoji ?? null,
        defaultUnit: input.defaultUnit ?? null,
        aliases: input.aliases ?? [],
        allergens: input.allergens ?? [],
        createdBy: actorId,
      },
      select: INGREDIENT_SELECT,
    });
    return mapIngredient(row as IngredientRow);
  },
};

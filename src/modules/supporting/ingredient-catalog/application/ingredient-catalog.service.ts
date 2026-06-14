import { Errors } from '@platform/api/errors';
import { ingredientRepository } from '../infrastructure/ingredient.repository';
import type { CreateIngredientInput, IngredientCatalog } from '../domain/ingredient.entity';

export async function getIngredientCatalog(organizationId: string): Promise<IngredientCatalog> {
  const [categories, ingredients] = await Promise.all([
    ingredientRepository.listCategories(),
    ingredientRepository.listIngredients(organizationId),
  ]);
  return { categories, ingredients };
}

export async function createCustomIngredient(
  organizationId: string,
  actorId: string,
  input: CreateIngredientInput,
) {
  const categoryOk = await ingredientRepository.categoryExists(input.categoryId);
  if (!categoryOk) throw Errors.validation('Ingredient category does not exist');
  if (!input.name.trim()) throw Errors.validation('Ingredient name is required');
  return ingredientRepository.createCustomIngredient(organizationId, actorId, input);
}

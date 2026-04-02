import { logger } from '@platform/logging/logger';
import { productCategoriesRepository } from '../infrastructure/product-categories.repository';
import type { ProductCategory } from '../domain/offer.entity';
import type { CreateCategoryInput, UpdateCategoryInput } from '../infrastructure/product-categories.repository';

export type { CreateCategoryInput, UpdateCategoryInput };

const TAG = 'ProductCategoriesService';

/** Flat list of all org categories. Caller builds the tree client-side. */
export async function listProductCategoryTree(orgId: string): Promise<ProductCategory[]> {
  return productCategoriesRepository.list(orgId);
}

export async function createProductCategory(
  input: Omit<CreateCategoryInput, never>,
): Promise<ProductCategory> {
  const cat = await productCategoriesRepository.create(input);
  logger.info(TAG, `Category created: ${cat.name}`, { categoryId: cat.id });
  return cat;
}

export async function updateProductCategory(
  id: string,
  orgId: string,
  input: UpdateCategoryInput,
): Promise<ProductCategory | null> {
  const updated = await productCategoriesRepository.update(id, orgId, input);
  if (updated) logger.info(TAG, `Category updated: ${id}`);
  return updated;
}

export async function deleteProductCategory(id: string, orgId: string): Promise<boolean> {
  const deleted = await productCategoriesRepository.delete(id, orgId);
  if (deleted) logger.info(TAG, `Category deleted: ${id}`);
  return deleted;
}

import { logger } from '@platform/logging/logger';
import type { OfferProduct, ProductCategory } from '../domain/offer.entity';
import { productCategoriesRepository } from '../infrastructure/product-categories.repository';
import { productsRepository } from '../infrastructure/products.repository';
import type {
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
} from '../infrastructure/product-categories.repository';
import type {
  CreateProductInput,
  UpdateProductInput,
} from '../infrastructure/products.repository';

export type { CreateProductInput, UpdateProductInput };
export type { CreateProductCategoryInput, UpdateProductCategoryInput };

const TAG = 'ProductsService';

export async function listProducts(
  orgId: string,
  search?: string,
  category?: string,
  isActive?: boolean,
): Promise<OfferProduct[]> {
  return productsRepository.list(orgId, search, category, isActive);
}

export async function listProductCategories(orgId: string): Promise<ProductCategory[]> {
  return productCategoriesRepository.list(orgId);
}

export async function createProduct(
  input: Omit<CreateProductInput, 'createdBy'>,
  actorId: string,
): Promise<OfferProduct> {
  const product = await productsRepository.create({ ...input, createdBy: actorId });
  logger.info(TAG, `Product created: ${product.name}`, { productId: product.id });
  return product;
}

export async function updateProduct(
  id: string,
  orgId: string,
  input: UpdateProductInput,
): Promise<OfferProduct | null> {
  const updated = await productsRepository.update(id, orgId, input);
  if (updated) {
    logger.info(TAG, `Product updated: ${id}`);
  }
  return updated;
}

export async function deleteProduct(id: string, orgId: string): Promise<boolean> {
  const deleted = await productsRepository.delete(id, orgId);
  if (deleted) {
    logger.info(TAG, `Product deleted: ${id}`);
  }
  return deleted;
}

export async function createProductCategory(
  input: Omit<CreateProductCategoryInput, 'createdBy'>,
  actorId: string,
): Promise<ProductCategory> {
  const category = await productCategoriesRepository.create({ ...input, createdBy: actorId });
  logger.info(TAG, `Product category created: ${category.name}`, { categoryId: category.id });
  return category;
}

export async function updateProductCategory(
  id: string,
  orgId: string,
  input: UpdateProductCategoryInput,
): Promise<ProductCategory | null> {
  const updated = await productCategoriesRepository.update(id, orgId, input);
  if (updated) {
    logger.info(TAG, `Product category updated: ${id}`);
  }
  return updated;
}

export async function deleteProductCategory(id: string, orgId: string): Promise<boolean> {
  const deleted = await productCategoriesRepository.delete(id, orgId);
  if (deleted) {
    logger.info(TAG, `Product category deleted: ${id}`);
  }
  return deleted;
}

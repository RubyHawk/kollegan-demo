import { logger } from '@platform/logging/logger';
import { assertValidCustomFields } from '@modules/supporting/custom-fields';
import { productsRepository } from '../infrastructure/products.repository';
import type { OfferProduct } from '../domain/offer.entity';
import type {
  CreateProductInput,
  UpdateProductInput,
} from '../infrastructure/products.repository';

export type { CreateProductInput, UpdateProductInput };

const TAG = 'ProductsService';

export async function listProducts(
  orgId: string,
  search?: string,
  category?: string,
  isActive?: boolean,
  companyId?: string,
): Promise<OfferProduct[]> {
  return productsRepository.list(orgId, search, category, isActive, companyId);
}

export async function listProductCategories(orgId: string): Promise<string[]> {
  return productsRepository.listCategories(orgId);
}

export async function createProduct(
  input: Omit<CreateProductInput, 'createdBy'>,
  actorId: string,
): Promise<OfferProduct> {
  await assertValidCustomFields(input.organizationId, 'product', input.customFields);

  const product = await productsRepository.create({ ...input, createdBy: actorId });
  logger.info(TAG, `Product created: ${product.name}`, { productId: product.id });
  return product;
}

export async function updateProduct(
  id: string,
  orgId: string,
  input: UpdateProductInput,
): Promise<OfferProduct | null> {
  await assertValidCustomFields(orgId, 'product', input.customFields);

  const updated = await productsRepository.update(id, orgId, input);
  if (updated) logger.info(TAG, `Product updated: ${id}`);
  return updated;
}

export async function deleteProduct(id: string, orgId: string): Promise<boolean> {
  const deleted = await productsRepository.delete(id, orgId);
  if (deleted) logger.info(TAG, `Product deleted: ${id}`);
  return deleted;
}

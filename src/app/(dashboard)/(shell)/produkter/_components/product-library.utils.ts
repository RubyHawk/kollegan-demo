import type { OfferProduct, ProductCategory } from '@shared/lib/api/products.api';
import type { CategoryNode, ProductCategoryMeta, ProductForm } from './product-library.types';
import { EMPTY_PRODUCT_FORM } from './product-library.types';

export function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(value);
}

export function productInitials(name: string) {
  return name.trim().slice(0, 2).toUpperCase();
}

export function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export function buildCategoryTree(categories: ProductCategory[]): CategoryNode[] {
  const mains = categories
    .filter((category) => !category.parentId)
    .sort((left, right) => left.name.localeCompare(right.name, 'sv'));

  return mains.map((main) => ({
    main,
    children: categories
      .filter((category) => category.parentId === main.id)
      .sort((left, right) => left.name.localeCompare(right.name, 'sv')),
  }));
}

export function buildStructuredCategoryLabel(mainName: string, subName?: string) {
  return subName ? `${mainName} / ${subName}` : mainName;
}

export function getProductCategoryMeta(
  product: OfferProduct,
  categoryById: Map<string, ProductCategory>,
): ProductCategoryMeta {
  if (!product.categoryId) {
    return {
      label: product.category,
      isStructured: false,
    };
  }

  const selected = categoryById.get(product.categoryId);
  if (!selected) {
    return {
      label: product.category,
      isStructured: false,
    };
  }

  const main = selected.parentId ? categoryById.get(selected.parentId) : selected;
  const sub = selected.parentId ? selected : undefined;

  return {
    label: product.category ?? buildStructuredCategoryLabel(main?.name ?? selected.name, sub?.name),
    mainCategoryId: main?.id ?? selected.id,
    mainCategoryName: main?.name ?? selected.name,
    subCategoryId: sub?.id,
    subCategoryName: sub?.name,
    isStructured: true,
  };
}

export function buildProductForm(
  product: OfferProduct | null,
  categoryById: Map<string, ProductCategory>,
): ProductForm {
  if (!product) {
    return EMPTY_PRODUCT_FORM;
  }

  const meta = getProductCategoryMeta(product, categoryById);

  return {
    name: product.name,
    description: product.description ?? '',
    unitPrice: String(product.unitPrice),
    vatRate: String(product.vatRate),
    unit: product.unit ?? '',
    sku: product.sku ?? '',
    imageUrl: product.imageUrl ?? '',
    isActive: product.isActive,
    categoryMode: meta.isStructured ? 'hierarchy' : 'custom',
    customCategory: meta.isStructured ? '' : (product.category ?? ''),
    mainCategoryId: meta.mainCategoryId ?? '',
    subCategoryId: meta.subCategoryId ?? '',
  };
}

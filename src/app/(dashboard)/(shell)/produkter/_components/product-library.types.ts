'use client';

import type { OfferProduct, ProductCategory } from '@shared/lib/api/products.api';

export type CategorySupportState = 'available' | 'unavailable';
export type CategoryMode = 'hierarchy' | 'custom';
export type CategoryFilterKey = '' | 'uncategorized' | `main:${string}` | `sub:${string}` | `legacy:${string}`;

export interface ProductForm {
  name: string;
  description: string;
  unitPrice: string;
  vatRate: string;
  unit: string;
  sku: string;
  imageUrl: string;
  isActive: boolean;
  categoryMode: CategoryMode;
  customCategory: string;
  mainCategoryId: string;
  subCategoryId: string;
}

export interface CategoryNode {
  main: ProductCategory;
  children: ProductCategory[];
}

export interface ProductCategoryMeta {
  label?: string;
  mainCategoryId?: string;
  mainCategoryName?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  isStructured: boolean;
}

export interface CategoryComposerPayload {
  name: string;
  parentId?: string;
}

export interface ProductRowProps {
  product: OfferProduct;
  meta?: ProductCategoryMeta;
  deleting: boolean;
  onEdit: (product: OfferProduct) => void;
  onToggleActive: (product: OfferProduct) => void;
  onDelete: (product: OfferProduct) => void;
}

export const EMPTY_PRODUCT_FORM: ProductForm = {
  name: '',
  description: '',
  unitPrice: '',
  vatRate: '0.25',
  unit: '',
  sku: '',
  imageUrl: '',
  isActive: true,
  categoryMode: 'hierarchy',
  customCategory: '',
  mainCategoryId: '',
  subCategoryId: '',
};

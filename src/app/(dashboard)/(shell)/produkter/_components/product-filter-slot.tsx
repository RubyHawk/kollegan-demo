'use client';

import { ProductFilterPanel } from './product-library-filters';
import type { CategoryFilterKey, CategoryNode, CategorySupportState } from './product-library.types';

interface ProductFilterSlotProps {
  productsCount: number;
  uncategorizedCount: number;
  showInactive: boolean;
  categoryFilter: CategoryFilterKey;
  activeMainFilterId: string;
  categoryTree: CategoryNode[];
  categorySupport: CategorySupportState;
  categorySupportMessage: string | null;
  mainCounts: Map<string, number>;
  subCounts: Map<string, number>;
  legacyCounts: Map<string, number>;
  legacyCategoryLabels: string[];
  onShowInactiveChange: (showInactive: boolean) => void;
  onCategoryFilterChange: (filter: CategoryFilterKey) => void;
  onManageCategories: () => void;
}

export function ProductFilterSlot(props: ProductFilterSlotProps) {
  return <ProductFilterPanel {...props} />;
}

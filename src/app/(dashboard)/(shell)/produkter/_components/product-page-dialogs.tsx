'use client';

import type { OfferProduct, ProductCategory } from '@shared/lib/api/products.api';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import ToastContainer from '@shared/ui/toast/toast-container';
import type { Toast } from '@shared/ui/toast/types';
import { CategoryManagerDialog } from './category-manager-dialog';
import { ProductModal } from './product-modal';
import type {
  CategoryComposerPayload,
  CategoryNode,
  CategorySupportState,
  ProductForm,
} from './product-library.types';

interface ProductPageDialogsProps {
  modalOpen: boolean;
  editingProduct: OfferProduct | null;
  categoryTree: CategoryNode[];
  categoryById: Map<string, ProductCategory>;
  categorySupport: CategorySupportState;
  categorySupportMessage: string | null;
  saving: boolean;
  selectedCompanyName?: string;
  categoryManagerOpen: boolean;
  mainCounts: Map<string, number>;
  subCounts: Map<string, number>;
  categorySaving: boolean;
  deletingCategoryId: string | null;
  deleteProduct: OfferProduct | null;
  deletingId: string | null;
  toasts: Toast[];
  onCloseProduct: () => void;
  onSaveProduct: (form: ProductForm) => void;
  onOpenCategoryManager: () => void;
  onCategoryManagerOpenChange: (open: boolean) => void;
  onCreateCategory: (payload: CategoryComposerPayload) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  onDeleteProductOpenChange: (open: boolean) => void;
  onConfirmDeleteProduct: (product: OfferProduct) => void;
  onDismissToast: (id: string) => void;
}

export function ProductPageDialogs({
  modalOpen,
  editingProduct,
  categoryTree,
  categoryById,
  categorySupport,
  categorySupportMessage,
  saving,
  selectedCompanyName,
  categoryManagerOpen,
  mainCounts,
  subCounts,
  categorySaving,
  deletingCategoryId,
  deleteProduct,
  deletingId,
  toasts,
  onCloseProduct,
  onSaveProduct,
  onOpenCategoryManager,
  onCategoryManagerOpenChange,
  onCreateCategory,
  onDeleteCategory,
  onDeleteProductOpenChange,
  onConfirmDeleteProduct,
  onDismissToast,
}: ProductPageDialogsProps) {
  return (
    <>
      {modalOpen && (
        <ProductModal
          key={editingProduct?.id ?? 'new-product'}
          open={modalOpen}
          product={editingProduct}
          categories={categoryTree}
          categoryById={categoryById}
          categorySupport={categorySupport}
          categorySupportMessage={categorySupportMessage}
          saving={saving}
          selectedCompanyName={selectedCompanyName}
          onClose={onCloseProduct}
          onSave={onSaveProduct}
          onOpenCategoryManager={onOpenCategoryManager}
        />
      )}

      <CategoryManagerDialog
        open={categoryManagerOpen}
        onOpenChange={onCategoryManagerOpenChange}
        categories={categoryTree}
        supportState={categorySupport}
        supportMessage={categorySupportMessage}
        mainCounts={mainCounts}
        subCounts={subCounts}
        onCreateCategory={onCreateCategory}
        onDeleteCategory={onDeleteCategory}
        saving={categorySaving}
        deletingId={deletingCategoryId}
        selectedCompanyName={selectedCompanyName}
      />

      <ConfirmDestructiveDialog
        open={Boolean(deleteProduct)}
        onOpenChange={onDeleteProductOpenChange}
        title={deleteProduct ? `Ta bort ${deleteProduct.name}?` : 'Ta bort produkt?'}
        description="Produkten försvinner från biblioteket och visas inte längre i offertflödet."
        confirmLabel="Ta bort"
        loading={!!deleteProduct && deletingId === deleteProduct.id}
        onConfirm={() => {
          if (deleteProduct) {
            onConfirmDeleteProduct(deleteProduct);
          }
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
    </>
  );
}

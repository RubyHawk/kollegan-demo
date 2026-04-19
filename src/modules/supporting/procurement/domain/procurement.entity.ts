export type PurchaseOrderStatus = 'draft' | 'submitted' | 'received' | 'cancelled';

export interface Supplier {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  orgNumber: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderLineItem {
  id: string;
  organizationId: string;
  purchaseOrderId: string;
  projectLineItemId: string | null;
  description: string;
  quantity: number;
  receivedQuantity: number;
  unit: string;
  unitCost: number;
  vatRate: number;
  sortOrder: number;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  organizationId: string;
  projectId: string;
  supplierId: string;
  poNumber: number | null;
  status: PurchaseOrderStatus;
  supplierReference: string | null;
  expectedDeliveryDate: string | null;
  submittedAt: string | null;
  submittedBy: string | null;
  receivedAt: string | null;
  receivedBy: string | null;
  notes: string | null;
  totalExVat: number;
  totalIncVat: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  lineItems?: PurchaseOrderLineItem[];
}

export interface CreateSupplierInput {
  organizationId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  orgNumber?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  createdBy?: string | null;
}

export type UpdateSupplierInput = Partial<Omit<CreateSupplierInput, 'organizationId' | 'createdBy'>>;

export interface PurchaseOrderItemInput {
  projectLineItemId?: string | null;
  description: string;
  quantity: number;
  unit?: string | null;
  unitCost: number;
  vatRate?: number;
}

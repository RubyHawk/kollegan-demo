export type ProjectStage = 'details' | 'ordered' | 'arrived' | 'in_progress' | 'completed';
export type PurchaseOrderStatus = 'draft' | 'submitted' | 'received' | 'cancelled';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  orgNumber: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
}

export interface ProjectLineItem {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  discount: number;
  lineTotalExVat: number;
  lineTotalIncVat: number;
  sortOrder: number;
  sourceOfferLineItemId: string | null;
  sourceProductId: string | null;
}

export interface PurchaseOrderLineItem {
  id: string;
  projectLineItemId: string | null;
  description: string;
  quantity: number;
  receivedQuantity: number;
  unit: string;
  unitCost: number;
  vatRate: number;
  sortOrder: number;
}

export interface PurchaseOrder {
  id: string;
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
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  lineItems?: PurchaseOrderLineItem[];
}

export interface ProjectStageEvent {
  id: string;
  fromStage: ProjectStage | null;
  toStage: ProjectStage;
  actorId: string | null;
  reason: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface Project {
  id: string;
  customerId: string;
  offerId: string;
  name: string;
  stage: ProjectStage;
  offerNumber: number | null;
  offerAcceptedAt: string | null;
  priceDisplayMode: string;
  totalExVat: number;
  totalIncVat: number;
  siteAddress: string | null;
  sitePostalCode: string | null;
  siteCity: string | null;
  siteCountry: string | null;
  squareMeters: number | null;
  objectType: string | null;
  objectDescription: string | null;
  accessNotes: string | null;
  wishedInstallDate: string | null;
  wishedInstallDateText: string | null;
  onsiteContactName: string | null;
  onsiteContactPhone: string | null;
  onsiteContactEmail: string | null;
  internalNotes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  lineItems?: ProjectLineItem[];
  purchaseOrders?: PurchaseOrder[];
  stageEvents?: ProjectStageEvent[];
}

export interface InstallDetailsForm {
  siteAddress: string;
  sitePostalCode: string;
  siteCity: string;
  siteCountry: string;
  squareMeters: string;
  objectType: string;
  objectDescription: string;
  accessNotes: string;
  wishedInstallDate: string;
  wishedInstallDateText: string;
  onsiteContactName: string;
  onsiteContactPhone: string;
  onsiteContactEmail: string;
  internalNotes: string;
}

export interface PurchaseOrderFormLine {
  projectLineItemId: string;
  description: string;
  quantity: string;
  unit: string;
  unitCost: string;
  vatRate: string;
}

export interface PurchaseOrderForm {
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  supplierPhone: string;
  supplierOrgNumber: string;
  expectedDeliveryDate: string;
  notes: string;
  items: PurchaseOrderFormLine[];
}

export interface ReceiptLineForm {
  lineItemId: string;
  description: string;
  quantity: number;
  receivedQuantity: string;
  unit: string;
}

export const PROJECT_STAGES: ProjectStage[] = ['details', 'ordered', 'arrived', 'in_progress', 'completed'];

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  details: 'Uppgifter',
  ordered: 'Beställt',
  arrived: 'Ankommet',
  in_progress: 'Pågår',
  completed: 'Klart',
};

export const PROJECT_STAGE_QUERY: Record<ProjectStage, string> = {
  details: 'uppgifter',
  ordered: 'bestallt',
  arrived: 'ankommet',
  in_progress: 'pagar',
  completed: 'klart',
};

export const QUERY_TO_STAGE: Record<string, ProjectStage> = {
  uppgifter: 'details',
  bestallt: 'ordered',
  ankommet: 'arrived',
  pagar: 'in_progress',
  klart: 'completed',
};

export const EMPTY_DETAILS_FORM: InstallDetailsForm = {
  siteAddress: '',
  sitePostalCode: '',
  siteCity: '',
  siteCountry: 'SE',
  squareMeters: '',
  objectType: '',
  objectDescription: '',
  accessNotes: '',
  wishedInstallDate: '',
  wishedInstallDateText: '',
  onsiteContactName: '',
  onsiteContactPhone: '',
  onsiteContactEmail: '',
  internalNotes: '',
};

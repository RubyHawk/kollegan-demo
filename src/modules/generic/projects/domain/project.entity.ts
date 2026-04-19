import type { Customer } from '@modules/supporting/customers';
import type { PurchaseOrder } from '@modules/supporting/procurement';

export type ProjectStage = 'details' | 'ordered' | 'arrived' | 'in_progress' | 'completed';

export interface ProjectLineItem {
  id: string;
  organizationId: string;
  projectId: string;
  sourceOfferLineItemId: string | null;
  sourceProductId: string | null;
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
  createdAt: string;
}

export interface ProjectStageEvent {
  id: string;
  organizationId: string;
  projectId: string;
  fromStage: ProjectStage | null;
  toStage: ProjectStage;
  actorId: string | null;
  reason: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface InstallDetails {
  siteAddress?: string | null;
  sitePostalCode?: string | null;
  siteCity?: string | null;
  siteCountry?: string | null;
  squareMeters?: number | null;
  objectType?: string | null;
  objectDescription?: string | null;
  accessNotes?: string | null;
  wishedInstallDate?: Date | null;
  wishedInstallDateText?: string | null;
  onsiteContactName?: string | null;
  onsiteContactPhone?: string | null;
  onsiteContactEmail?: string | null;
  internalNotes?: string | null;
}

export interface Project {
  id: string;
  organizationId: string;
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
  createdBy: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  lineItems?: ProjectLineItem[];
  purchaseOrders?: PurchaseOrder[];
  stageEvents?: ProjectStageEvent[];
}

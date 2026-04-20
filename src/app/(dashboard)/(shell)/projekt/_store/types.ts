import type { ProjectStage } from '@shared/lib/api/projects.api';

export type {
  Customer,
  Project,
  ProjectLineItem,
  ProjectStage,
  ProjectStageEvent,
  PurchaseOrder,
  PurchaseOrderLineItem,
  PurchaseOrderStatus,
} from '@shared/lib/api/projects.api';
export type { Supplier } from '@shared/lib/api/procurement.api';

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

import { apiGet, apiPatch, apiPost } from '../api-client';
import type { Supplier } from './procurement.api';

const BASE_URL = '/api/v1/projekt';

interface ApiEnvelope<T> {
  data: T;
}

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

export interface ListProjectsParams {
  stage?: ProjectStage;
  search?: string;
  customerId?: string;
  limit?: number;
  offset?: number;
}

export interface CountProjectsParams {
  search?: string;
  customerId?: string;
}

export interface UpdateProjectDetailsPayload {
  siteAddress?: string | null;
  sitePostalCode?: string | null;
  siteCity?: string | null;
  siteCountry?: string | null;
  squareMeters?: number | null;
  objectType?: string | null;
  objectDescription?: string | null;
  accessNotes?: string | null;
  wishedInstallDate?: string | null;
  wishedInstallDateText?: string | null;
  onsiteContactName?: string | null;
  onsiteContactPhone?: string | null;
  onsiteContactEmail?: string | null;
  internalNotes?: string | null;
}

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  items: Array<{
    projectLineItemId?: string | null;
    description: string;
    quantity: number;
    unit?: string;
    unitCost: number;
    vatRate?: number;
  }>;
  expectedDeliveryDate?: string | null;
  notes?: string | null;
}

export interface SubmitPurchaseOrderPayload {
  supplierReference?: string | null;
  expectedDeliveryDate?: string | null;
  notes?: string | null;
}

export interface ReceivePurchaseOrderPayload {
  receivedItems?: Array<{
    lineItemId: string;
    receivedQuantity: number;
  }>;
  notes?: string | null;
}

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listProjects(params: ListProjectsParams = {}) {
  const res = await apiGet<ApiEnvelope<{
    projects: Project[];
    total: number;
    limit: number;
    offset: number;
  }>>(`${BASE_URL}${query(params)}`);
  return res.data;
}

export async function countProjects(params: CountProjectsParams = {}): Promise<Record<ProjectStage, number>> {
  const res = await apiGet<ApiEnvelope<{ counts: Record<ProjectStage, number> }>>(
    `${BASE_URL}/counts${query(params)}`,
  );
  return res.data.counts;
}

export async function getProject(id: string): Promise<Project> {
  const res = await apiGet<ApiEnvelope<{ project: Project }>>(`${BASE_URL}/${id}`);
  return res.data.project;
}

export async function updateProjectDetails(
  id: string,
  payload: UpdateProjectDetailsPayload,
): Promise<Project> {
  const res = await apiPatch<ApiEnvelope<{ project: Project }>>(`${BASE_URL}/${id}/details`, payload);
  return res.data.project;
}

export async function advanceProjectStage(id: string, toStage: ProjectStage): Promise<Project> {
  const res = await apiPost<ApiEnvelope<{ project: Project }>>(`${BASE_URL}/${id}/advance`, { toStage });
  return res.data.project;
}

export async function createProjectPurchaseOrder(
  projectId: string,
  payload: CreatePurchaseOrderPayload,
): Promise<PurchaseOrder> {
  const res = await apiPost<ApiEnvelope<{ purchaseOrder: PurchaseOrder }>>(
    `${BASE_URL}/${projectId}/purchase-orders`,
    payload,
  );
  return res.data.purchaseOrder;
}

export async function submitProjectPurchaseOrder(
  projectId: string,
  poId: string,
  payload: SubmitPurchaseOrderPayload = {},
): Promise<PurchaseOrder> {
  const res = await apiPatch<ApiEnvelope<{ purchaseOrder: PurchaseOrder }>>(
    `${BASE_URL}/${projectId}/purchase-orders/${poId}/submit`,
    payload,
  );
  return res.data.purchaseOrder;
}

export async function receiveProjectPurchaseOrder(
  projectId: string,
  poId: string,
  payload: ReceivePurchaseOrderPayload,
): Promise<PurchaseOrder> {
  const res = await apiPatch<ApiEnvelope<{ purchaseOrder: PurchaseOrder }>>(
    `${BASE_URL}/${projectId}/purchase-orders/${poId}/receive`,
    payload,
  );
  return res.data.purchaseOrder;
}

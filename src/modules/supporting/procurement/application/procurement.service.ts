import { eventBus } from '@platform/events';
import { procurementRepository } from '../infrastructure/procurement.repository';
import type {
  CreateSupplierInput,
  PurchaseOrder,
  PurchaseOrderItemInput,
  Supplier,
  UpdateSupplierInput,
} from '../domain/procurement.entity';
import type { ListSuppliersFilter } from '../infrastructure/procurement.repository';
import { PURCHASE_ORDER_RECEIVED, PURCHASE_ORDER_SUBMITTED } from '../events/procurement.events';

export type {
  CreateSupplierInput,
  PurchaseOrder,
  PurchaseOrderItemInput,
  PurchaseOrderLineItem,
  PurchaseOrderStatus,
  Supplier,
  UpdateSupplierInput,
} from '../domain/procurement.entity';
export type { ListSuppliersFilter };

export async function listSuppliers(orgId: string, filter: ListSuppliersFilter): Promise<{ suppliers: Supplier[]; total: number }> {
  return procurementRepository.listSuppliers(orgId, filter);
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  return procurementRepository.createSupplier(input);
}

export async function updateSupplier(id: string, orgId: string, input: UpdateSupplierInput): Promise<Supplier | null> {
  return procurementRepository.updateSupplier(id, orgId, input);
}

export async function deleteSupplier(id: string, orgId: string): Promise<boolean> {
  return procurementRepository.softDeleteSupplier(id, orgId);
}

export async function createPurchaseOrder(
  projectId: string,
  orgId: string,
  supplierId: string,
  items: PurchaseOrderItemInput[],
  actorId: string,
  input: { expectedDeliveryDate?: Date | null; notes?: string | null } = {},
): Promise<PurchaseOrder> {
  const project = await procurementRepository.findProject(projectId, orgId);
  if (!project) throw Object.assign(new Error('Project not found'), { code: 'PROJECT_NOT_FOUND' });
  if (items.length === 0) throw Object.assign(new Error('Purchase order needs at least one line'), { code: 'EMPTY_PO' });
  return procurementRepository.createPurchaseOrder({
    organizationId: orgId,
    projectId,
    supplierId,
    items,
    expectedDeliveryDate: input.expectedDeliveryDate,
    notes: input.notes,
    createdBy: actorId,
  });
}

export async function markPurchaseOrderSubmitted(
  poId: string,
  projectId: string,
  orgId: string,
  actorId: string,
  input: { supplierReference?: string | null; expectedDeliveryDate?: Date | null; notes?: string | null },
): Promise<PurchaseOrder | null> {
  const po = await procurementRepository.submitPurchaseOrder(poId, projectId, orgId, actorId, input);
  if (!po) return null;
  eventBus.publish({
    type: PURCHASE_ORDER_SUBMITTED,
    orgId,
    occurredAt: new Date().toISOString(),
    payload: { purchaseOrderId: po.id, projectId: po.projectId, supplierId: po.supplierId, actorId },
  });
  return po;
}

export async function markPurchaseOrderReceived(
  poId: string,
  projectId: string,
  orgId: string,
  actorId: string,
  receivedItems?: Array<{ lineItemId: string; receivedQuantity: number }>,
  notes?: string | null,
): Promise<PurchaseOrder | null> {
  const po = await procurementRepository.receivePurchaseOrder(poId, projectId, orgId, actorId, receivedItems, notes);
  if (!po) return null;
  eventBus.publish({
    type: PURCHASE_ORDER_RECEIVED,
    orgId,
    occurredAt: new Date().toISOString(),
    payload: { purchaseOrderId: po.id, projectId: po.projectId, supplierId: po.supplierId, actorId },
  });
  return po;
}

export const PURCHASE_ORDER_SUBMITTED = 'purchase_order.submitted' as const;
export const PURCHASE_ORDER_RECEIVED = 'purchase_order.received' as const;

export interface PurchaseOrderSubmittedEvent {
  type: typeof PURCHASE_ORDER_SUBMITTED;
  orgId: string;
  occurredAt: string;
  payload: { purchaseOrderId: string; projectId: string; supplierId: string; actorId: string };
}

export interface PurchaseOrderReceivedEvent {
  type: typeof PURCHASE_ORDER_RECEIVED;
  orgId: string;
  occurredAt: string;
  payload: { purchaseOrderId: string; projectId: string; supplierId: string; actorId: string };
}

export type ProcurementEvent = PurchaseOrderSubmittedEvent | PurchaseOrderReceivedEvent;

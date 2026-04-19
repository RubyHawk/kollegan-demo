export const CUSTOMER_CREATED = 'customer.created' as const;
export const CUSTOMER_UPDATED = 'customer.updated' as const;

export interface CustomerCreatedEvent {
  type: typeof CUSTOMER_CREATED;
  orgId: string;
  occurredAt: string;
  payload: { customerId: string; name: string; email?: string | null };
}

export interface CustomerUpdatedEvent {
  type: typeof CUSTOMER_UPDATED;
  orgId: string;
  occurredAt: string;
  payload: { customerId: string; fields: string[] };
}

export type CustomerEvent = CustomerCreatedEvent | CustomerUpdatedEvent;

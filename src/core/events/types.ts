/**
 * Core domain event types.
 *
 * All domain events must implement DomainEvent.
 * Payloads must be fully serializable — no class instances, no Promises.
 */

export interface DomainEvent {
  /** Namespaced event type, e.g. 'room.booked', 'crm.contact_upserted' */
  type: string;
  /** The organization that owns this event */
  orgId: string;
  /** ISO 8601 timestamp when the event occurred */
  occurredAt: string;
  /** Fully serializable event data */
  payload: Record<string, unknown>;
}

export type EventHandler<T extends DomainEvent = DomainEvent> = (
  event: T,
) => Promise<void>;

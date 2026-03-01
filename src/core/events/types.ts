/**
 * Core domain event types.
 *
 * All domain events must implement DomainEvent.
 * Payloads must be fully serializable — no class instances, no Promises.
 *
 * Event type naming convention: {domain}.{aggregate}.{past-tense-verb}
 *   e.g. 'hotel.room.booked', 'crm.contact.upserted', 'automation.workflow.triggered'
 */

export interface DomainEvent {
  /** Namespaced event type: {domain}.{aggregate}.{verb}, e.g. 'hotel.room.booked' */
  type: string;
  /** The organization that owns this event — enforces multi-tenancy at event level */
  orgId: string;
  /** ISO 8601 timestamp when the event occurred */
  occurredAt: string;
  /** Fully serializable event data */
  payload: Record<string, unknown>;
  /** ID of the aggregate this event is about (for event sourcing / audit) */
  aggregateId?: string;
  /** Schema version — increment when payload shape changes (default: 1) */
  version?: number;
}

export type EventHandler<T extends DomainEvent = DomainEvent> = (
  event: T,
) => Promise<void>;

// ─── Event type registry ──────────────────────────────────────────────────────
// Authoritative list of all domain event types in the platform.
// Prefer importing these constants over raw strings to prevent typos.
// Format: {domain}.{aggregate}.{past-tense-verb}

export const EventTypes = {
  // ── Core: Automation ──────────────────────────────────────────────────────
  WORKFLOW_TRIGGERED:      'automation.workflow.triggered',
  WORKFLOW_COMPLETED:      'automation.workflow.completed',
  WORKFLOW_FAILED:         'automation.workflow.failed',
  WORKFLOW_CANCELLED:      'automation.workflow.cancelled',
  WORKFLOW_STEP_COMPLETED: 'automation.workflow.step.completed',
  WORKFLOW_STEP_FAILED:    'automation.workflow.step.failed',

  // ── Core: Voice ───────────────────────────────────────────────────────────
  CALL_STARTED: 'voice.call.started',
  CALL_ENDED:   'voice.call.ended',

  // ── Supporting: CRM ───────────────────────────────────────────────────────
  CONTACT_UPSERTED: 'crm.contact.upserted',
  RECORD_CREATED:   'crm.record.created',

  // ── Supporting: Leads ─────────────────────────────────────────────────────
  LEAD_CREATED:       'leads.lead.created',
  LEAD_STAGE_CHANGED: 'leads.lead.stage_changed',
  LEAD_CONVERTED:     'leads.lead.converted',
  LEAD_ASSIGNED:      'leads.lead.assigned',
  LEAD_DELETED:       'leads.lead.deleted',

} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

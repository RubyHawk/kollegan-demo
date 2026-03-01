// ─── Lead domain events ───────────────────────────────────────────────────────
// Published by leads.service on every significant state change.
// Subscribers: automation module (triggers), audit module (logging).

export const LEAD_CREATED       = 'lead.created' as const;
export const LEAD_STAGE_CHANGED = 'lead.stage_changed' as const;
export const LEAD_CONVERTED     = 'lead.converted' as const;
export const LEAD_ASSIGNED      = 'lead.assigned' as const;
export const LEAD_DELETED       = 'lead.deleted' as const;

export interface LeadCreatedEvent {
  type: typeof LEAD_CREATED;
  orgId: string;
  occurredAt: string;
  payload: {
    leadId: string;
    name: string;
    source: string;
    assignedTo: string | null;
  };
}

export interface LeadStageChangedEvent {
  type: typeof LEAD_STAGE_CHANGED;
  orgId: string;
  occurredAt: string;
  payload: {
    leadId: string;
    fromStatus: string;
    toStatus: string;
    actorId: string;
  };
}

export interface LeadConvertedEvent {
  type: typeof LEAD_CONVERTED;
  orgId: string;
  occurredAt: string;
  payload: {
    leadId: string;
    customerId: string;
    actorId: string;
  };
}

export interface LeadAssignedEvent {
  type: typeof LEAD_ASSIGNED;
  orgId: string;
  occurredAt: string;
  payload: {
    leadId: string;
    assignedTo: string;
    actorId: string;
  };
}

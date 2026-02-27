import type { DomainEvent } from '@core/events';
import { EventTypes } from '@core/events';

// ─── Event type constants ───────────────────────────────────────────────────────
// Format: crm.{aggregate}.{verb} — matches EventTypes registry in @core/events

export const CRM_CONTACT_UPSERTED = EventTypes.CONTACT_UPSERTED; // 'crm.contact.upserted'
export const CRM_RECORD_CREATED   = EventTypes.RECORD_CREATED;   // 'crm.record.created'

// ─── Event interfaces ───────────────────────────────────────────────────────────

export interface CrmContactUpsertedEvent extends DomainEvent {
  type: typeof CRM_CONTACT_UPSERTED;
  payload: {
    customerId: string;
    name?: string;
    phone?: string;
    email?: string;
    /** true if this was a newly created customer, false if existing was updated */
    isNew: boolean;
  };
}

export interface CrmRecordCreatedEvent extends DomainEvent {
  type: typeof CRM_RECORD_CREATED;
  payload: {
    crmRecordId: string;
    customerId: string;
    vapiCallId?: string;
    bookedRooms: string[];
  };
}

export type CrmEvent = CrmContactUpsertedEvent | CrmRecordCreatedEvent;

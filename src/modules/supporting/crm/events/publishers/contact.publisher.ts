/**
 * CRM Contact Publisher.
 *
 * Centralises all eventBus.publish calls for CRM domain events.
 * Currently the publish calls live inline in crm.service.ts — Phase 4 will
 * extract them here so the service only deals with business logic.
 */

import { eventBus } from '@core/events';
import type { CrmContactUpsertedEvent, CrmRecordCreatedEvent } from '../contact.events';
import { CRM_CONTACT_UPSERTED, CRM_RECORD_CREATED } from '../contact.events';

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? 'demo';

export async function publishContactUpserted(payload: {
  customerId: string;
  name?: string;
  phone?: string;
  email?: string;
  isNew: boolean;
}): Promise<void> {
  await eventBus.publish<CrmContactUpsertedEvent>({
    type:        CRM_CONTACT_UPSERTED,
    orgId:       DEMO_ORG_ID,
    occurredAt:  new Date().toISOString(),
    aggregateId: payload.customerId,
    payload,
  });
}

export async function publishRecordCreated(payload: {
  crmRecordId: string;
  customerId: string;
  vapiCallId?: string;
  bookedRooms: string[];
}): Promise<void> {
  await eventBus.publish<CrmRecordCreatedEvent>({
    type:        CRM_RECORD_CREATED,
    orgId:       DEMO_ORG_ID,
    occurredAt:  new Date().toISOString(),
    aggregateId: payload.crmRecordId,
    payload,
  });
}

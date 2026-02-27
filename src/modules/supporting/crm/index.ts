/**
 * CRM module — public interface.
 *
 * Other modules ONLY import from this file.
 *
 * Layer structure:
 *   domain/         — contact.entity.ts (CrmContact, CrmEntry, CallEntry)
 *   application/    — crm.service.ts (lookupCustomer, updateCrm, startCallTranscript)
 *   infrastructure/ — contact.repository.ts (Prisma queries)
 *   events/         — contact.events.ts + publishers/contact.publisher.ts
 *   ui/             — components/crm-tab.tsx
 */

// UI
export { default as CrmTab } from './ui/components/crm-tab';

// Domain types
export type { CrmContact, CrmEntry, CallEntry } from './domain/contact.entity';

// Application — service layer
export { lookupCustomer, updateCrm, startCallTranscript } from './application/crm.service';
export type { CustomerLookupResult, CrmUpdateInput, CrmUpdateResult } from './application/crm.service';

// Infrastructure — expose upsertCustomer for voice register.ts (known cross-domain usage)
export { upsertCustomer } from './infrastructure/contact.repository';

// Domain events
export {
  CRM_CONTACT_UPSERTED,
  CRM_RECORD_CREATED,
} from './events/contact.events';
export type { CrmContactUpsertedEvent, CrmRecordCreatedEvent, CrmEvent } from './events/contact.events';

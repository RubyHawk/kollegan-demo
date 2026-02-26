export { default as CrmTab } from './components/crm-tab';
export type { CrmContact, CrmEntry, CallEntry } from './types';

// Service — public business-logic interface for other modules
export { lookupCustomer, updateCrm, startCallTranscript } from './service';
export type { CustomerLookupResult, CrmUpdateInput, CrmUpdateResult } from './service';

// Domain events — import these when subscribing or publishing CRM events
export {
  CRM_CONTACT_UPSERTED,
  CRM_RECORD_CREATED,
} from './events';
export type { CrmContactUpsertedEvent, CrmRecordCreatedEvent, CrmEvent } from './events';

export { default as CRMTab } from './components/crm-tab';
export type { CRMContact } from './types';

// Domain events — import these when subscribing or publishing CRM events
export {
  CRM_CONTACT_UPSERTED,
  CRM_RECORD_CREATED,
} from './events';
export type { CrmContactUpsertedEvent, CrmRecordCreatedEvent, CrmEvent } from './events';

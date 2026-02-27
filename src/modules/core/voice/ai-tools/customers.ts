/**
 * Voice AI tool — customer lookup / upsert.
 *
 * Thin re-export layer. All logic lives in @modules/supporting/crm/application/crm.service and
 * @modules/supporting/crm/infrastructure/contact.repository. Import from those modules directly for
 * non-voice-tool use cases.
 */
export type { CustomerLookupResult } from '@modules/supporting/crm/application/crm.service';
export { lookupCustomer } from '@modules/supporting/crm/application/crm.service';
export { upsertCustomer } from '@modules/supporting/crm/infrastructure/contact.repository';

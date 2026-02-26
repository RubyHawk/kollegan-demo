/**
 * Voice AI tool — customer lookup / upsert.
 *
 * Thin re-export layer. All logic lives in @features/crm/service and
 * @features/crm/repository. Import from those modules directly for
 * non-voice-tool use cases.
 */
export type { CustomerLookupResult } from '@features/crm/service';
export { lookupCustomer } from '@features/crm/service';
export { upsertCustomer } from '@features/crm/repository';

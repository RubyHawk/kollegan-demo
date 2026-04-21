/**
 * Voice AI tool — customer lookup / upsert.
 *
 * Thin re-export layer. All logic is exposed through the CRM module public API.
 * Import from @modules/supporting/crm for non-voice-tool use cases.
 */
export type { CustomerLookupResult } from '@modules/supporting/crm';
export { lookupCustomer, upsertCustomer } from '@modules/supporting/crm';

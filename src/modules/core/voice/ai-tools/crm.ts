/**
 * Voice AI tool — CRM record update.
 *
 * Thin re-export layer. All logic is exposed through the CRM module public API.
 * Import from @modules/supporting/crm for non-voice-tool use cases.
 */
export type { CrmUpdateInput, CrmUpdateResult } from '@modules/supporting/crm';
export { updateCrm } from '@modules/supporting/crm';

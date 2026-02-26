/**
 * Voice AI tool — CRM record update.
 *
 * Thin re-export layer. All logic lives in @features/crm/service.
 * Import from there directly for non-voice-tool use cases.
 */
export type { CrmUpdateInput, CrmUpdateResult } from '@features/crm/service';
export { updateCrm } from '@features/crm/service';

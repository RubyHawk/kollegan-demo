/**
 * Voice AI tool — CRM record update.
 *
 * Thin re-export layer. All logic lives in @modules/supporting/crm/application/crm.service.
 * Import from there directly for non-voice-tool use cases.
 */
export type { CrmUpdateInput, CrmUpdateResult } from '@modules/supporting/crm/application/crm.service';
export { updateCrm } from '@modules/supporting/crm/application/crm.service';

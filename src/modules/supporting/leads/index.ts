/**
 * Lead Management Module — Phase 3
 *
 * Full lead pipeline: new → contacted → qualified → proposal → won/lost
 * Conversion flow: convertLead() links to a CRM Customer record.
 * Domain events: LEAD_CREATED, LEAD_STAGE_CHANGED, LEAD_CONVERTED, LEAD_ASSIGNED
 */

export type { Lead, LeadActivity, LeadStatus, LeadSource } from './domain/lead.entity';
export {
  createLead,
  getLead,
  listLeads,
  updateLead,
  convertLead,
  deleteLead,
  addLeadActivity,
  getLeadActivities,
} from './application/leads.service';
export type { CreateLeadInput, UpdateLeadInput, ListLeadsFilter } from './application/leads.service';

export {
  LEAD_CREATED,
  LEAD_STAGE_CHANGED,
  LEAD_CONVERTED,
  LEAD_ASSIGNED,
} from './events/lead.events';

// ── API Handlers ─────────────────────────────────────────────────────────────
export {
  handleListLeads,
  handleCreateLead,
  handleGetLead,
  handleUpdateLead,
  handleDeleteLead,
  handleListActivities,
  handleAddActivity,
  handleConvertLead,
} from './api/handlers/leads.handler';

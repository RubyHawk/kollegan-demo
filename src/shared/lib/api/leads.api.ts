import { apiDelete, apiGet, apiPatch, apiPost } from '../api-client';

const BASE_URL = '/api/v1/leads';

interface ApiEnvelope<T> {
  data: T;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
export type LeadSource = 'voice_call' | 'web_form' | 'manual' | 'referral' | 'n8n_webhook';

export interface Lead {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: LeadStatus;
  source: LeadSource;
  score: number | null;
  assignedTo: string | null;
  notes: string | null;
  estimatedValue: number | null;
  createdAt: string;
  updatedAt?: string;
  convertedAt?: string | null;
  customerId?: string | null;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'note' | 'call' | 'email' | 'stage_change' | 'ai_interaction';
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface ListLeadsParams {
  status?: LeadStatus;
  assignedTo?: string;
  source?: LeadSource;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateLeadPayload {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: LeadStatus;
  source?: LeadSource;
  score?: number;
  assignedTo?: string;
  notes?: string;
  estimatedValue?: number;
}

export type UpdateLeadPayload = Partial<CreateLeadPayload>;

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listLeads(params: ListLeadsParams = {}) {
  const res = await apiGet<ApiEnvelope<{
    leads: Lead[];
    total: number;
    limit: number;
    offset: number;
  }>>(`${BASE_URL}${query(params)}`);
  return res.data;
}

export async function createLead(payload: CreateLeadPayload): Promise<Lead> {
  const res = await apiPost<ApiEnvelope<{ lead: Lead }>>(BASE_URL, payload);
  return res.data.lead;
}

export async function getLead(id: string): Promise<Lead> {
  const res = await apiGet<ApiEnvelope<{ lead: Lead }>>(`${BASE_URL}/${id}`);
  return res.data.lead;
}

export async function updateLead(id: string, payload: UpdateLeadPayload): Promise<Lead> {
  const res = await apiPatch<ApiEnvelope<{ lead: Lead }>>(`${BASE_URL}/${id}`, payload);
  return res.data.lead;
}

export async function deleteLead(id: string): Promise<void> {
  await apiDelete(`${BASE_URL}/${id}`);
}

export async function listLeadActivities(leadId: string): Promise<LeadActivity[]> {
  const res = await apiGet<ApiEnvelope<{ activities: LeadActivity[] }>>(`${BASE_URL}/${leadId}/activities`);
  return res.data.activities;
}

export async function addLeadActivity(
  leadId: string,
  payload: Pick<LeadActivity, 'type' | 'content'>,
): Promise<LeadActivity> {
  const res = await apiPost<ApiEnvelope<{ activity: LeadActivity }>>(`${BASE_URL}/${leadId}/activities`, payload);
  return res.data.activity;
}

export async function convertLead(leadId: string, customerId: string): Promise<Lead> {
  const res = await apiPost<ApiEnvelope<{ lead: Lead }>>(`${BASE_URL}/${leadId}/convert`, { customerId });
  return res.data.lead;
}

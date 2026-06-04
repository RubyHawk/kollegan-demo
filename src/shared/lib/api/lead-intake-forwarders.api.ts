import { apiDelete, apiGet, apiPatch, apiPost } from '../api-client';

interface ApiEnvelope<T> {
  data: T;
}

export type LeadIntakeFieldTarget =
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'postalCode'
  | 'requestedService'
  | 'message'
  | 'referralSource'
  | 'custom';

export interface LeadIntakeFieldMapping {
  key: string;
  label: string;
  target: LeadIntakeFieldTarget;
  required?: boolean;
  order: number;
}

export interface LeadIntakeFieldConfig {
  version: 1;
  fields: LeadIntakeFieldMapping[];
}

export interface LeadIntakeForwarderRecipient {
  id: string;
  forwarderId: string;
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface LeadIntakeForwarder {
  id: string;
  organizationId: string;
  companyId: string;
  name: string;
  sourceLabel: string;
  provider: string;
  intakeAddress: string;
  normalizedIntakeAddress: string;
  senderEmail?: string | null;
  senderName?: string | null;
  fieldConfig: LeadIntakeFieldConfig;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  recipients: LeadIntakeForwarderRecipient[];
}

export interface SaveLeadIntakeForwarderPayload {
  name: string;
  sourceLabel: string;
  intakeAddress: string;
  senderEmail?: string | null;
  senderName?: string | null;
  fieldConfig?: LeadIntakeFieldConfig;
  isActive?: boolean;
  recipientUserIds: string[];
}

function baseUrl(companyId: string) {
  return `/api/v1/companies/${companyId}/lead-intake-forwarders`;
}

export async function listLeadIntakeForwarders(companyId: string) {
  const res = await apiGet<ApiEnvelope<{
    forwarders: LeadIntakeForwarder[];
    defaultFieldConfig: LeadIntakeFieldConfig;
  }>>(baseUrl(companyId));
  return res.data;
}

export async function createLeadIntakeForwarder(
  companyId: string,
  payload: SaveLeadIntakeForwarderPayload,
): Promise<LeadIntakeForwarder> {
  const res = await apiPost<ApiEnvelope<{ forwarder: LeadIntakeForwarder }>>(baseUrl(companyId), payload);
  return res.data.forwarder;
}

export async function updateLeadIntakeForwarder(
  companyId: string,
  forwarderId: string,
  payload: Partial<SaveLeadIntakeForwarderPayload>,
): Promise<LeadIntakeForwarder> {
  const res = await apiPatch<ApiEnvelope<{ forwarder: LeadIntakeForwarder }>>(
    `${baseUrl(companyId)}/${forwarderId}`,
    payload,
  );
  return res.data.forwarder;
}

export async function deactivateLeadIntakeForwarder(companyId: string, forwarderId: string): Promise<void> {
  await apiDelete(`${baseUrl(companyId)}/${forwarderId}`);
}

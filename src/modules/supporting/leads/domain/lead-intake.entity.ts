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

export interface ParsedLeadIntakeSubmission {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  requestedService?: string;
  message?: string;
  referralSource?: string;
  customFields: Record<string, string>;
  rawFields: Record<string, string>;
  missingRequired: string[];
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

export interface LeadIntakeForwarderRecipient {
  id: string;
  forwarderId: string;
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

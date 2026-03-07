export type IntegrationProvider = 'n8n' | 'zapier' | 'slack' | 'email' | 'google_calendar' | 'custom_webhook';
export type IntegrationStatus = 'active' | 'inactive' | 'error';

export interface Integration {
  id: string;
  organizationId: string;
  name: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  lastSyncAt: Date | null;
  errorMessage: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIntegrationInput {
  organizationId: string;
  name: string;
  provider: IntegrationProvider;
  config: Record<string, unknown>;
  createdBy: string;
}

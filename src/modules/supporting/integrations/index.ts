/**
 * Integrations Module — manages external service connections
 * (n8n, Zapier, Slack, email, Google Calendar, custom webhooks).
 */

export type { Integration, IntegrationProvider, IntegrationStatus, CreateIntegrationInput } from './domain/integration.entity';
export { createIntegration, listIntegrations, getIntegration, updateIntegrationStatus, deleteIntegration } from './application/integration.service';
export { INTEGRATION_CREATED, INTEGRATION_SYNCED, INTEGRATION_ERROR } from './events/integration.events';
export { handleCalendarEvents } from './api/handlers/calendar-events.handler';

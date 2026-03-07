import type { Integration, CreateIntegrationInput } from '../domain/integration.entity';

// Integration tables are not yet in the Prisma schema.
// This repository provides the interface for services and handlers.

const integrations: Integration[] = [];

export const integrationRepository = {
  async create(input: CreateIntegrationInput): Promise<Integration> {
    const integration: Integration = {
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      name: input.name,
      provider: input.provider,
      status: 'active',
      config: input.config,
      lastSyncAt: null,
      errorMessage: null,
      createdBy: input.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    integrations.push(integration);
    return integration;
  },

  async list(organizationId: string): Promise<Integration[]> {
    return integrations.filter(i => i.organizationId === organizationId);
  },

  async get(id: string, organizationId: string): Promise<Integration | null> {
    return integrations.find(i => i.id === id && i.organizationId === organizationId) ?? null;
  },

  async updateStatus(id: string, organizationId: string, status: string): Promise<Integration | null> {
    const integration = integrations.find(i => i.id === id && i.organizationId === organizationId);
    if (!integration) return null;
    integration.status = status as Integration['status'];
    integration.updatedAt = new Date();
    return integration;
  },

  async delete(id: string, organizationId: string): Promise<boolean> {
    const idx = integrations.findIndex(i => i.id === id && i.organizationId === organizationId);
    if (idx === -1) return false;
    integrations.splice(idx, 1);
    return true;
  },
};

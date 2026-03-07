import type { CreateIntegrationInput } from '../domain/integration.entity';
import { integrationRepository } from '../infrastructure/integration.repository';

export async function createIntegration(input: CreateIntegrationInput) {
  return integrationRepository.create(input);
}

export async function listIntegrations(organizationId: string) {
  return integrationRepository.list(organizationId);
}

export async function getIntegration(id: string, organizationId: string) {
  return integrationRepository.get(id, organizationId);
}

export async function updateIntegrationStatus(id: string, organizationId: string, status: string) {
  return integrationRepository.updateStatus(id, organizationId, status);
}

export async function deleteIntegration(id: string, organizationId: string) {
  return integrationRepository.delete(id, organizationId);
}

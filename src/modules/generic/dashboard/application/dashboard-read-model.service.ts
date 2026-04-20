import { dashboardReadModelRepository } from '../infrastructure/dashboard-read-model.repository';

export async function getDashboardOrganizationIdForUser(userId: string): Promise<string | null> {
  return dashboardReadModelRepository.getOrganizationIdForUser(userId);
}

export async function getDashboardReadModel(organizationId: string) {
  return dashboardReadModelRepository.getDashboardReadModel(organizationId);
}

import { logger } from '@platform/logging/logger';
import { companiesRepository } from '../infrastructure/companies.repository';

const TAG = 'CompanyMembersService';

export async function listCompanyMembers(companyId: string, orgId: string) {
  const [members, availableUsers] = await Promise.all([
    companiesRepository.listMembers(companyId, orgId),
    companiesRepository.listAssignableUsers(orgId),
  ]);

  return {
    members,
    availableUsers,
  };
}

export async function upsertCompanyMember(
  companyId: string,
  orgId: string,
  userId: string,
  role: 'staff' | 'admin',
  grantedBy?: string,
) {
  const member = await companiesRepository.upsertMember({
    companyId,
    organizationId: orgId,
    userId,
    role,
    grantedBy,
  });

  logger.info(TAG, 'Company member upserted', { companyId, userId, role });
  return member;
}

export async function removeCompanyMember(companyId: string, orgId: string, userId: string) {
  const deleted = await companiesRepository.removeMember(companyId, orgId, userId);
  if (deleted) {
    logger.info(TAG, 'Company member removed', { companyId, userId });
  }
  return deleted;
}

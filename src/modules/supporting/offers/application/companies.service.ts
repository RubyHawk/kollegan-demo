import { companiesRepository } from '../infrastructure/companies.repository';

export async function listCompaniesForUser(orgId: string, userId: string, restrictToMemberships: boolean) {
  return companiesRepository.list(orgId, undefined, { userId, restrictToMemberships });
}

export async function getCompany(companyId: string, orgId: string) {
  return companiesRepository.getById(companyId, orgId);
}

export async function getCompanyMember(companyId: string, userId: string) {
  return companiesRepository.getMember(companyId, userId);
}

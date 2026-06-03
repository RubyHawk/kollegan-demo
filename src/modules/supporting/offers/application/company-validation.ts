/**
 * Company ownership validation for offer-domain create/update operations.
 *
 * Ensures a given companyId exists and belongs to the caller's organisation
 * before allowing it to be stored on offers, templates, products, or categories.
 */

import { Errors } from '@platform/api/errors';
import { companiesRepository } from '../infrastructure/companies.repository';

/**
 * Throws a 400 Bad Request if the company does not exist within the org.
 * Use on all create/update paths that accept a companyId.
 */
export async function validateCompanyInOrg(companyId: string, orgId: string): Promise<void> {
  const company = await companiesRepository.getById(companyId, orgId);
  if (!company) {
    throw Errors.badRequest('Company not found or does not belong to this organisation');
  }
}

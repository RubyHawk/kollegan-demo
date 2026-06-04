import { listCompaniesForUser } from '@modules/supporting/offers';
import {
  listRecipientSuggestions,
  type RecipientSuggestion,
} from '../infrastructure/recipient-suggestions.repository';

export async function getRecipientSuggestions(input: {
  organizationId: string;
  userId: string;
  roles: string[];
  search: string;
  companyId?: string;
  limit?: number;
}): Promise<RecipientSuggestion[]> {
  const isOrgAdmin = input.roles.includes('admin') || input.roles.includes('super_admin');
  const companyIds = input.companyId
    ? [input.companyId]
    : isOrgAdmin
      ? undefined
      : (await listCompaniesForUser(input.organizationId, input.userId, true)).map((company) => company.id);

  if (companyIds && companyIds.length === 0) return [];

  return listRecipientSuggestions({
    organizationId: input.organizationId,
    search: input.search,
    companyIds,
    includeLegacyCompanyless: isOrgAdmin || Boolean(input.companyId),
    limit: input.limit ?? 10,
  });
}

export type { RecipientSuggestion };

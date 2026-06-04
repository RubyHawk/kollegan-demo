const mocks = vi.hoisted(() => ({
  listCompaniesForUser: vi.fn(),
  listRecipientSuggestions: vi.fn(),
}));

vi.mock('@modules/supporting/offers', () => ({
  listCompaniesForUser: mocks.listCompaniesForUser,
}));

vi.mock('@modules/supporting/leads/infrastructure/recipient-suggestions.repository', () => ({
  listRecipientSuggestions: mocks.listRecipientSuggestions,
}));

import { getRecipientSuggestions } from '@modules/supporting/leads/application/recipient-suggestions.service';

describe('recipient suggestions access control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listRecipientSuggestions.mockResolvedValue([]);
  });

  it('does not search a requested company that the staff user is not a member of', async () => {
    mocks.listCompaniesForUser.mockResolvedValue([{ id: 'company-a' }]);

    const suggestions = await getRecipientSuggestions({
      organizationId: 'org-1',
      userId: 'user-1',
      roles: ['user'],
      search: 'sara',
      companyId: 'company-b',
    });

    expect(suggestions).toEqual([]);
    expect(mocks.listRecipientSuggestions).not.toHaveBeenCalled();
  });

  it('passes only accessible company scope for a non-admin staff user', async () => {
    mocks.listCompaniesForUser.mockResolvedValue([{ id: 'company-a' }]);

    await getRecipientSuggestions({
      organizationId: 'org-1',
      userId: 'user-1',
      roles: ['user'],
      search: 'sara',
      companyId: 'company-a',
      limit: 5,
    });

    expect(mocks.listRecipientSuggestions).toHaveBeenCalledWith({
      organizationId: 'org-1',
      search: 'sara',
      companyIds: ['company-a'],
      includeLegacyCompanyless: false,
      limit: 5,
    });
  });
});

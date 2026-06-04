import { prisma } from '@platform/database/prisma';
import { listRecipientSuggestions } from '@modules/supporting/leads/infrastructure/recipient-suggestions.repository';

describe('recipient suggestions repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.customer.findMany).mockResolvedValue([]);
    vi.mocked(prisma.lead.findMany).mockResolvedValue([]);
    vi.mocked(prisma.offer.findMany).mockResolvedValue([]);
  });

  it('keeps company scope and search predicates combined for customers and leads', async () => {
    await listRecipientSuggestions({
      organizationId: 'org-1',
      search: 'sara',
      companyIds: ['company-a'],
      includeLegacyCompanyless: false,
      limit: 10,
    });

    const expectedCompanyScope = { OR: [{ companyId: { in: ['company-a'] } }] };

    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-1',
          deletedAt: null,
          AND: [
            expectedCompanyScope,
            expect.objectContaining({
              OR: expect.arrayContaining([
                { name: { contains: 'sara', mode: 'insensitive' } },
                { email: { contains: 'sara', mode: 'insensitive' } },
              ]),
            }),
          ],
        }),
      }),
    );
    expect(prisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-1',
          deletedAt: null,
          status: { notIn: ['won', 'lost'] },
          AND: [
            expectedCompanyScope,
            expect.objectContaining({
              OR: expect.arrayContaining([
                { name: { contains: 'sara', mode: 'insensitive' } },
                { requestedService: { contains: 'sara', mode: 'insensitive' } },
              ]),
            }),
          ],
        }),
      }),
    );
  });
});

import { prisma } from '@platform/database/prisma';
import { customersRepository } from '@modules/supporting/customers/infrastructure/customers.repository';

describe('lead intake customer lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reuses any org-wide unique email match before inbound intake creates a customer', async () => {
    const updatedAt = new Date('2026-06-05T00:00:00.000Z');
    vi.mocked(prisma.customer.findFirst).mockResolvedValueOnce({
      id: 'customer-1',
      organizationId: 'org-1',
      companyId: 'company-a',
      name: 'Sara Lind',
      email: 'sara@example.se',
      phone: null,
      normalizedPhone: null,
      company: null,
      address: null,
      postalCode: null,
      city: null,
      country: 'SE',
      notes: null,
      customFields: null,
      convertedFromLeadId: null,
      createdAt: updatedAt,
      updatedAt,
      deletedAt: null,
    });

    const customer = await customersRepository.findByEmailForCompany('org-1', 'company-b', 'SARA@example.se');

    expect(customer?.id).toBe('customer-1');
    expect(prisma.customer.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        email: 'sara@example.se',
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
    });
  });
});

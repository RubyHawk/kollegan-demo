import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@platform/database/prisma', () => ({
  prisma: {
    featureFlag: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from '@platform/database/prisma';
import { featureFlagsRepository } from '../../src/modules/supporting/feature-flags/infrastructure/feature-flags.repository';

describe('featureFlagsRepository.list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.featureFlag.findMany).mockResolvedValue([]);
    vi.mocked(prisma.featureFlag.count).mockResolvedValue(0);
  });

  it('combines expiry and search predicates instead of overwriting one OR with another', async () => {
    await featureFlagsRepository.list('org_1', {
      search: 'public',
      includeExpired: false,
      environment: 'production',
    });

    const where = vi.mocked(prisma.featureFlag.findMany).mock.calls[0]?.[0]?.where as {
      AND?: Array<Record<string, unknown>>;
    };

    expect(where).toMatchObject({
      organizationId: 'org_1',
      deletedAt: null,
      environment: 'production',
    });
    expect(where.AND).toHaveLength(2);
    expect(where.AND?.[0]).toMatchObject({
      OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
    });
    expect(where.AND?.[1]).toMatchObject({
      OR: [
        { key: { contains: 'public', mode: 'insensitive' } },
        { owner: { contains: 'public', mode: 'insensitive' } },
        { description: { contains: 'public', mode: 'insensitive' } },
      ],
    });
  });

  it('omits the expiry predicate when expired flags are explicitly included', async () => {
    await featureFlagsRepository.list('org_1', {
      search: 'public',
      includeExpired: true,
    });

    const where = vi.mocked(prisma.featureFlag.count).mock.calls[0]?.[0]?.where as {
      AND?: Array<Record<string, unknown>>;
    };

    expect(where.AND).toHaveLength(1);
    expect(where.AND?.[0]).toMatchObject({
      OR: [
        { key: { contains: 'public', mode: 'insensitive' } },
        { owner: { contains: 'public', mode: 'insensitive' } },
        { description: { contains: 'public', mode: 'insensitive' } },
      ],
    });
  });
});

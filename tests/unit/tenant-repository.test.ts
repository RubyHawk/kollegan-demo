import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@platform/database/prisma', () => ({
  prisma: {
    organizationDomain: {
      findUnique: vi.fn(),
    },
    organizationModule: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@platform/database/prisma';
import { tenantRepository } from '../../src/modules/supporting/identity/infrastructure/tenant.repository';

describe('tenantRepository.resolveByHost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes hostnames and returns enabled module keys', async () => {
    vi.mocked(prisma.organizationDomain.findUnique).mockResolvedValue({
      id: 'domain_1',
      organizationId: 'org_1',
      hostname: 'portal.fluffys.se',
      kind: 'portal',
      isPrimary: true,
      verifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      organization: {
        id: 'org_1',
        slug: 'fluffys',
        name: "Fluffy's",
        modules: [{ moduleKey: 'clock_in' }, { moduleKey: 'restaurant_menu' }],
      },
    } as never);

    await expect(tenantRepository.resolveByHost('Portal.Fluffys.se:443')).resolves.toMatchObject({
      organizationId: 'org_1',
      organizationSlug: 'fluffys',
      hostname: 'portal.fluffys.se',
      kind: 'portal',
      enabledModules: ['clock_in', 'restaurant_menu'],
    });
  });
});

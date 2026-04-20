import { prisma } from '@platform/database/prisma';

export const DEV_ORG_ID = 'dev-org-01';

export const devLoginRepository = {
  async ensureDevOrganization(): Promise<void> {
    await prisma.organization.upsert({
      where: { id: DEV_ORG_ID },
      update: {},
      create: {
        id: DEV_ORG_ID,
        name: 'Dev Organization',
        slug: 'dev-org',
        plan: 'demo',
        orgType: 'internal',
      },
    });
  },
};

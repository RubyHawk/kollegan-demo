import { prisma } from '@platform/database/prisma';
import type { Portal, CreatePortalInput } from '../domain/portal.entity';

export const portalRepository = {
  async create(input: CreatePortalInput): Promise<Portal> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = prisma as any;
    return p.portal.create({
      data: {
        organizationId: input.organizationId,
        slug: input.slug,
        provisionedBy: input.provisionedBy ?? null,
        provisionedAt: input.provisionedBy ? new Date() : null,
      },
    });
  },

  async getByOrg(organizationId: string): Promise<Portal | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = prisma as any;
    return p.portal.findUnique({ where: { organizationId } });
  },

  async getBySlug(slug: string): Promise<Portal | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = prisma as any;
    return p.portal.findUnique({ where: { slug } });
  },
};

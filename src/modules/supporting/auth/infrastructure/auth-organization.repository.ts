import { prisma } from '@platform/database/prisma';

export interface AuthOrganizationRecord {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

export const authOrganizationRepository = {
  async findBySlug(slug: string): Promise<AuthOrganizationRecord | null> {
    return prisma.organization.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
      },
    });
  },

  async create(input: { name: string; slug: string; plan: string }): Promise<AuthOrganizationRecord> {
    return prisma.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        plan: input.plan,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
      },
    });
  },
};

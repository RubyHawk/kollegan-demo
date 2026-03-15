/**
 * Identity repository — all DB queries for the identity module.
 *
 * No business logic here. No service calls here.
 * Identity service calls these methods; route handlers do not.
 */

import { prisma } from '@platform/database/prisma';
import type { CreateOrgInput, Organization } from '../domain/organization.entity';

function toOrg(raw: {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
}): Organization {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    plan: raw.plan as Organization['plan'],
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  };
}

export const identityRepository = {
  async findOrgById(id: string): Promise<Organization | null> {
    const org = await prisma.organization.findUnique({ where: { id } });
    return org ? toOrg(org) : null;
  },

  async findOrgBySlug(slug: string): Promise<Organization | null> {
    const org = await prisma.organization.findUnique({ where: { slug } });
    return org ? toOrg(org) : null;
  },

  async createOrg(input: CreateOrgInput): Promise<Organization> {
    const org = await prisma.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        plan: input.plan ?? 'starter',
      },
    });
    return toOrg(org);
  },

  async listOrgs(): Promise<Organization[]> {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return orgs.map(toOrg);
  },

  async upsertOrg(input: CreateOrgInput): Promise<Organization> {
    const org = await prisma.organization.upsert({
      where: { slug: input.slug },
      create: { name: input.name, slug: input.slug, plan: input.plan ?? 'starter' },
      update: { name: input.name },
    });
    return toOrg(org);
  },
};

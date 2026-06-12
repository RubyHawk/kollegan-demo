import { prisma } from '@platform/database/prisma';
import type { OrganizationDomainKind, TenantResolution } from '../domain/tenant.entity';

function normalizeHostname(host: string): string {
  return host.split(':')[0]?.trim().toLowerCase() ?? '';
}

export const tenantRepository = {
  async resolveByHost(host: string): Promise<TenantResolution | null> {
    const hostname = normalizeHostname(host);
    if (!hostname) return null;

    const domain = await prisma.organizationDomain.findUnique({
      where: { hostname },
      include: {
        organization: {
          select: {
            id: true,
            slug: true,
            name: true,
            modules: {
              where: { enabled: true },
              select: { moduleKey: true },
            },
          },
        },
      },
    });

    if (!domain) return null;

    return {
      organizationId: domain.organizationId,
      organizationSlug: domain.organization.slug,
      organizationName: domain.organization.name,
      hostname: domain.hostname,
      kind: domain.kind as OrganizationDomainKind,
      enabledModules: domain.organization.modules.map((orgModule) => orgModule.moduleKey),
    };
  },

  async listEnabledModules(organizationId: string): Promise<string[]> {
    const modules = await prisma.organizationModule.findMany({
      where: { organizationId, enabled: true },
      select: { moduleKey: true },
      orderBy: { moduleKey: 'asc' },
    });
    return modules.map((orgModule) => orgModule.moduleKey);
  },

  async hasEnabledModule(organizationId: string, moduleKey: string): Promise<boolean> {
    const orgModule = await prisma.organizationModule.findUnique({
      where: { organizationId_moduleKey: { organizationId, moduleKey } },
      select: { enabled: true },
    });
    return orgModule?.enabled ?? false;
  },
};

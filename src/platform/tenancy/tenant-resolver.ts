import { prisma } from '@platform/database/prisma';

export type PlatformTenantDomainKind = 'public' | 'portal' | 'offer';

export interface PlatformTenantResolution {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  hostname: string;
  kind: PlatformTenantDomainKind;
  enabledModules: string[];
}

export function normalizeTenantHost(host: string | null | undefined): string {
  return (host ?? '').split(':')[0]?.trim().toLowerCase() ?? '';
}

export async function resolveTenantByHost(host: string | null | undefined): Promise<PlatformTenantResolution | null> {
  const hostname = normalizeTenantHost(host);
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
    kind: domain.kind as PlatformTenantDomainKind,
    enabledModules: domain.organization.modules.map((orgModule) => orgModule.moduleKey),
  };
}

export async function listEnabledTenantModules(organizationId: string): Promise<string[]> {
  const modules = await prisma.organizationModule.findMany({
    where: { organizationId, enabled: true },
    select: { moduleKey: true },
    orderBy: { moduleKey: 'asc' },
  });
  return modules.map((orgModule) => orgModule.moduleKey);
}

export async function tenantHasModule(organizationId: string, moduleKey: string): Promise<boolean> {
  const orgModule = await prisma.organizationModule.findUnique({
    where: { organizationId_moduleKey: { organizationId, moduleKey } },
    select: { enabled: true },
  });
  return orgModule?.enabled ?? false;
}

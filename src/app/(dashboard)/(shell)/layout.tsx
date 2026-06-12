import { redirect } from 'next/navigation';
import { resolvePortalBrand } from '@modules/generic/branding';
import { getSessionUser } from '@modules/supporting/auth';
import { identityService, listEnabledOrganizationModules } from '@modules/supporting/identity';
import { BRAND_NAME } from '@shared/branding';
import AppShell from '@shared/ui/app-shell';
import type { ShellBrand } from '@shared/ui/sidebar-config';
import type { ReactNode } from 'react';

async function resolveShellBrand(orgId: string | null | undefined): Promise<ShellBrand> {
  try {
    const org = orgId ? await identityService.getOrg(orgId) : null;
    const brand = resolvePortalBrand(org ? { organizationSlug: org.slug, organizationName: org.name } : null);
    return { name: brand.name, isPlatform: brand.key === 'platform' };
  } catch {
    return { name: BRAND_NAME, isPlatform: true };
  }
}

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/logga-in');
  const [enabledModules, brand] = await Promise.all([
    user.orgId ? listEnabledOrganizationModules(user.orgId) : Promise.resolve([]),
    resolveShellBrand(user.orgId),
  ]);

  return <AppShell user={user} enabledModules={enabledModules} brand={brand}>{children}</AppShell>;
}

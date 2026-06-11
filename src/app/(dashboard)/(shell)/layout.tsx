import { redirect } from 'next/navigation';
import { getSessionUser } from '@modules/supporting/auth';
import { listEnabledOrganizationModules } from '@modules/supporting/identity';
import AppShell from '@shared/ui/app-shell';
import type { ReactNode } from 'react';

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/logga-in');
  const enabledModules = user.orgId ? await listEnabledOrganizationModules(user.orgId) : [];

  return <AppShell user={user} enabledModules={enabledModules}>{children}</AppShell>;
}

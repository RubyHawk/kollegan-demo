import { redirect } from 'next/navigation';
import { getSessionUser } from '@core/auth/session';
import AppShell from '@shared/ui/app-shell';
import type { ReactNode } from 'react';

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return <AppShell user={user}>{children}</AppShell>;
}

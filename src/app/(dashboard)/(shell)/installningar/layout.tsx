import { redirect } from 'next/navigation';
import { getSessionUser } from '@modules/supporting/auth';
import SettingsNav from './_components/settings-nav';
import type { ReactNode } from 'react';

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/logga-in');

  return (
    // Flush, full-height two-pane: the sub-rail sits against the app sidebar (no centered
    // gutter); the content scrolls on its own. Page context comes from the topbar
    // breadcrumb + the active rail item, so each page owns its own heading.
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <SettingsNav userRole={user.role} />
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { getSessionUser } from '@modules/supporting/auth';
import type { ReactNode } from 'react';
import SettingsNav from './_components/settings-nav';
import SettingsNavMobile from './_components/settings-nav-mobile';
import SettingsPageHeader from './_components/settings-page-header';

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/logga-in');

  return (
    // Flush, full-height two-pane: the rail sits against the app sidebar and the
    // content pane owns its own scroll (the app shell's <main> stops scrolling
    // because this child is exactly h-full). The page header and the mobile chip
    // row are non-scrolling flex siblings above the scroll pane, so they stay
    // pinned on every viewport. No <main> here — the app shell already renders one.
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <SettingsNav userRole={user.role} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <SettingsNavMobile userRole={user.role} />
        <SettingsPageHeader />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { getSessionUser } from '@modules/supporting/auth';
import SettingsNav from './_components/settings-nav';
import type { ReactNode } from 'react';

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/logga-in');

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] leading-tight">
          Inställningar
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Hantera din profil, utseende och säkerhet.
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-col md:flex-row md:items-start md:gap-6">
        <SettingsNav userRole={user.role} />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { getSettingsContextForPath } from '@shared/nav/settings-config';
import { PageHeader } from '@shared/ui/page-header';

// Uniform, pinned page header for every settings page, driven by SETTINGS_CONFIG
// so titles/intros live in one place. The eyebrow shows the owning settings group.
// Page-level actions stay page-owned (only one page has any today); PageHeader's
// `actions` prop is the hook if a shared slot ever becomes worth the extra plumbing.
export default function SettingsPageHeader() {
  const pathname = usePathname();
  const context = getSettingsContextForPath(pathname);
  if (!context) return null; // bare /installningar redirects to /installningar/profil

  return (
    <div className="shrink-0 border-b border-[var(--ui-border-subtle)] bg-[var(--ui-bg)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <PageHeader
          eyebrow={context.section.label}
          title={context.item.label}
          description={context.item.description}
        />
      </div>
    </div>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { findSettingsMeta } from '@shared/nav/settings-config';

/**
 * Per-page settings header, derived from the active route via SETTINGS_CONFIG.
 * Replaces the single generic "Inställningar" header so each page describes itself.
 */
export default function SettingsHeader() {
  const pathname = usePathname();
  const meta = findSettingsMeta(pathname);

  if (!meta) return null;

  return (
    <div className="mb-5">
      <h1 className="font-heading text-2xl font-semibold leading-tight text-[var(--ui-text)]">
        {meta.label}
      </h1>
      {meta.description && (
        <p className="mt-0.5 text-sm text-[var(--ui-text-muted)]">{meta.description}</p>
      )}
    </div>
  );
}

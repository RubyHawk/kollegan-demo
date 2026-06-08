'use client';

import { useMemo } from 'react';
import type { useActiveCompany } from '@shared/hooks/use-active-company';

type ActiveCompany = NonNullable<ReturnType<typeof useActiveCompany>['selectedCompany']>;

export function useSelectedCompanyBranding(selectedCompany: ActiveCompany | null | undefined) {
  return useMemo(() => (
    selectedCompany ? {
      name: selectedCompany.name,
      website: selectedCompany.website,
      logoUrl: selectedCompany.logoUrl,
      senderEmail: selectedCompany.senderEmail,
      senderName: selectedCompany.senderName,
      emailHeaderConfig: selectedCompany.emailHeaderConfig,
    } : undefined
  ), [selectedCompany]);
}

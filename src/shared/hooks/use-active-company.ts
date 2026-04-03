'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchWithRefresh } from '@shared/lib/api-client';

export interface ActiveCompanyOption {
  id: string;
  name: string;
  orgNumber?: string;
  logoUrl?: string;
  website?: string;
  senderEmail?: string;
  senderName?: string;
  emailHeaderConfig?: string;
}

const STORAGE_KEY = 'active-offer-company-id';

export function useActiveCompany() {
  const [companies, setCompanies] = useState<ActiveCompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyIdState] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithRefresh('/api/companies');
      if (!response.ok) {
        throw new Error(`Kunde inte hämta företag (${response.status})`);
      }

      const payload = await response.json() as { data?: { companies?: ActiveCompanyOption[] } };
      const nextCompanies = payload.data?.companies ?? [];
      setCompanies(nextCompanies);

      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) ?? '' : '';
      const hasStored = stored && nextCompanies.some((company) => company.id === stored);
      const fallbackId = hasStored ? stored : nextCompanies[0]?.id ?? '';
      setSelectedCompanyIdState((current) => (current && nextCompanies.some((company) => company.id === current) ? current : fallbackId));

      if (typeof window !== 'undefined') {
        if (fallbackId) {
          localStorage.setItem(STORAGE_KEY, fallbackId);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const setSelectedCompanyId = useCallback((nextId: string) => {
    setSelectedCompanyIdState(nextId);
    if (typeof window !== 'undefined') {
      if (nextId) {
        localStorage.setItem(STORAGE_KEY, nextId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId],
  );

  return {
    companies,
    selectedCompany,
    selectedCompanyId,
    setSelectedCompanyId,
    loading,
    error,
    reload: loadCompanies,
  };
}

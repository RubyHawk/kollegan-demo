'use client';

import { useState } from 'react';
import type { Company } from '@modules/supporting/offers';
import { CompanyLogoUpload } from './company-logo-upload';

export interface CompanyForm {
  name: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  region: string;
  country: string;
  website: string;
  logoUrl: string;
}

export const EMPTY_COMPANY_FORM: CompanyForm = {
  name: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  city: '',
  region: '',
  country: 'Sverige',
  website: '',
  logoUrl: '',
};

export function formFromCompany(company: Company | null): CompanyForm {
  if (!company) return EMPTY_COMPANY_FORM;

  return {
    name: company.name,
    addressLine1: company.addressLine1 ?? '',
    addressLine2: company.addressLine2 ?? '',
    postalCode: company.postalCode ?? '',
    city: company.city ?? '',
    region: company.region ?? '',
    country: company.country ?? 'Sverige',
    website: company.website ?? '',
    logoUrl: company.logoUrl ?? '',
  };
}

interface CompanyModalProps {
  open: boolean;
  company: Company | null;
  onClose: () => void;
  onSave: (form: CompanyForm) => void;
  saving: boolean;
}

export function CompanyModal({
  open,
  company,
  onClose,
  onSave,
  saving,
}: CompanyModalProps) {
  const [form, setForm] = useState<CompanyForm>(() => formFromCompany(company));

  if (!open) return null;

  const set =
    (key: keyof CompanyForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const inputCls =
    'w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none';
  const labelCls = 'mb-1 block text-xs font-medium text-[var(--text-secondary)]';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-h-[90dvh] w-full overflow-y-auto border border-[var(--border)] bg-[var(--surface-0)] shadow-xl sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {company ? 'Redigera företag' : 'Nytt företag'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className={labelCls}>Namn *</label>
            <input value={form.name} onChange={set('name')} placeholder="Soleria AB" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Adressrad 1</label>
            <input value={form.addressLine1} onChange={set('addressLine1')} placeholder="Radiatorvägen 3" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Adressrad 2</label>
            <input value={form.addressLine2} onChange={set('addressLine2')} placeholder="702 27 Örebro" className={inputCls} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Postnummer</label>
              <input value={form.postalCode} onChange={set('postalCode')} placeholder="702 27" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Stad</label>
              <input value={form.city} onChange={set('city')} placeholder="Örebro" className={inputCls} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Län / region</label>
              <input value={form.region} onChange={set('region')} placeholder="Örebro län" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Land</label>
              <input value={form.country} onChange={set('country')} placeholder="Sverige" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Webbplats</label>
            <input type="url" value={form.website} onChange={set('website')} placeholder="https://example.se" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Logga</label>
            <CompanyLogoUpload
              value={form.logoUrl}
              onChange={(logoUrl) => setForm((current) => ({ ...current, logoUrl }))}
            />
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">Avsändare i offerten</p>
            <p className="mt-1 leading-6">
              Företagsnamn och adress hämtas härifrån. Ansvarig person hämtas från användarens konto,
              och avsändarmejl för utskick styrs i organisationens e-postinställningar.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-alt)]"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim()}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-light)] disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? 'Sparar...' : company ? 'Spara ändringar' : 'Skapa företag'}
          </button>
        </div>
      </div>
    </div>
  );
}

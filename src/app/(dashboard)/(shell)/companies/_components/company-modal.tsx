'use client';

import { useState } from 'react';
import type { Company } from '@modules/supporting/offers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { CompanyLogoUpload } from './company-logo-upload';

export interface CompanyForm {
  name: string;
  orgNumber: string;
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
  orgNumber: '',
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
    orgNumber: company.orgNumber ?? '',
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

  const set =
    (key: keyof CompanyForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const inputCls =
    'w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none';
  const labelCls = 'mb-1.5 block text-xs font-medium text-[var(--text-secondary)]';

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent mobileVariant="fullscreen" showMobileClose className="max-w-5xl">
        <DialogHeader className="border-b border-[var(--border)] px-6 pb-5 pt-6 pr-16">
          <DialogTitle className="text-xl text-[var(--text-primary)]">
            {company ? 'Redigera företag' : 'Nytt företag'}
          </DialogTitle>
          <DialogDescription className="max-w-2xl leading-6">
            Namn, adress och logga styr hur företaget visas i dokument, mallar och produktscope. Du kan börja med bara namn och komplettera resten senare.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(80dvh,920px)] overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <p className="font-medium text-[var(--text-primary)]">Företagets identitet i offertflödet</p>
              <p className="mt-1 leading-6">
                Företagsnamn, adress och logga används i dokument och mallar. Du kan skapa företaget med bara namn och fylla på resten efteråt.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(220px,0.8fr)]">
              <div>
                <label className={labelCls}>Namn *</label>
                <input value={form.name} onChange={set('name')} placeholder="Soleria AB" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Organisationsnummer</label>
                <input value={form.orgNumber} onChange={set('orgNumber')} placeholder="556677-8899" className={inputCls} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Adressrad 1</label>
                <input value={form.addressLine1} onChange={set('addressLine1')} placeholder="Radiatorvägen 3" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Adressrad 2</label>
                <input value={form.addressLine2} onChange={set('addressLine2')} placeholder="Lokal 2 eller våning" className={inputCls} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Postnummer</label>
                <input value={form.postalCode} onChange={set('postalCode')} placeholder="702 27" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Stad</label>
                <input value={form.city} onChange={set('city')} placeholder="Örebro" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Län / region</label>
                <input value={form.region} onChange={set('region')} placeholder="Örebro län" className={inputCls} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
              <div>
                <label className={labelCls}>Webbplats</label>
                <input type="url" value={form.website} onChange={set('website')} placeholder="soleria.se" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Land</label>
                <input value={form.country} onChange={set('country')} placeholder="Sverige" className={inputCls} />
              </div>
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
                Företagsnamn, adress och logga hämtas härifrån. Ansvarig person hämtas från användarens konto, och avsändarmejl för utskick styrs i organisationens e-postinställningar.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-[var(--border)] px-6 pb-6 pt-4">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

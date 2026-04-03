'use client';

import { useState } from 'react';
import { cn } from '@shared/lib/utils';
import type { Company } from '@modules/supporting/offers';
import { CompanyLogoUpload } from './company-logo-upload';

export interface CompanyForm {
  name: string;
  orgNumber: string;
  website: string;
  logoUrl: string;
  senderEmail: string;
  senderName: string;
  industry: string;
  notes: string;
}

export const EMPTY_COMPANY_FORM: CompanyForm = {
  name: '',
  orgNumber: '',
  website: '',
  logoUrl: '',
  senderEmail: '',
  senderName: '',
  industry: '',
  notes: '',
};

export function formFromCompany(company: Company | null): CompanyForm {
  if (!company) return EMPTY_COMPANY_FORM;

  return {
    name: company.name,
    orgNumber: company.orgNumber ?? '',
    website: company.website ?? '',
    logoUrl: company.logoUrl ?? '',
    senderEmail: company.senderEmail ?? '',
    senderName: company.senderName ?? '',
    industry: company.industry ?? '',
    notes: company.notes ?? '',
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Organisationsnummer</label>
              <input value={form.orgNumber} onChange={set('orgNumber')} placeholder="556677-8899" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Bransch</label>
              <input value={form.industry} onChange={set('industry')} placeholder="Solfilm, el, konsulting..." className={inputCls} />
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Avsändarnamn</label>
              <input value={form.senderName} onChange={set('senderName')} placeholder="Soleria" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Avsändarmejl</label>
              <input type="email" value={form.senderEmail} onChange={set('senderEmail')} placeholder="no-reply@offert.soleria.se" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Anteckningar</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              placeholder="Intern information om företaget, branding eller arbetsflöde..."
              className={cn(inputCls, 'resize-none')}
            />
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

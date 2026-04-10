'use client';

import { useMemo, useState } from 'react';
import { Buildings, Globe, IdentificationCard, MapPinLine } from '@phosphor-icons/react';
import type { Company } from '@modules/supporting/offers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
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
  onOpenTemplates: () => void;
  saving: boolean;
}

export function CompanyModal({
  open,
  company,
  onClose,
  onSave,
  onOpenTemplates,
  saving,
}: CompanyModalProps) {
  const [form, setForm] = useState<CompanyForm>(() => formFromCompany(company));

  const set =
    (key: keyof CompanyForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const inputCls =
    'w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none';
  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]';
  const cardCls = 'rounded-[26px] border border-[var(--border)] bg-[var(--surface-0)] p-4 sm:p-5';

  const companyPreviewLines = useMemo(() => {
    return [
      form.name.trim(),
      form.orgNumber.trim() ? `Org.nr ${form.orgNumber.trim()}` : '',
      form.addressLine1.trim(),
      form.addressLine2.trim(),
      [form.postalCode.trim(), form.city.trim()].filter(Boolean).join(' '),
      form.region.trim(),
      form.country.trim(),
      form.website.trim().replace(/^https?:\/\//, ''),
    ].filter(Boolean);
  }, [form]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent
        mobileVariant="fullscreen"
        showMobileClose
        className="w-[min(100vw-1.5rem,1020px)] sm:max-w-[1020px]"
      >
        <DialogHeader className="border-b border-[var(--border)] px-5 pb-4 pt-5 pr-16 sm:px-6">
          <DialogTitle className="text-xl text-[var(--text-primary)]">
            {company ? 'Redigera företag' : 'Nytt företag'}
          </DialogTitle>
          <DialogDescription className="max-w-3xl leading-6">
            Samla företagets identitet, adress och logga på ett ställe. Det här används i offertens avsändarblock,
            i mallar och i företagets egna produkt- och mallscope.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(88dvh,860px)] overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_340px]">
            <div className="space-y-5">
              <section className={cardCls}>
                <div className="mb-4 flex items-start gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                    <Buildings size={18} weight="duotone" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Företagsidentitet</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                      Namn och organisationsnummer visas i offertens avsändarblock uppe till vänster.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.75fr)]">
                  <div>
                    <label className={labelCls}>Namn *</label>
                    <input value={form.name} onChange={set('name')} placeholder="Soleria AB" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Organisationsnummer</label>
                    <input value={form.orgNumber} onChange={set('orgNumber')} placeholder="556677-8899" className={inputCls} />
                  </div>
                </div>
              </section>

              <section className={cardCls}>
                <div className="mb-4 flex items-start gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                    <MapPinLine size={18} weight="duotone" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Adress och kontakt</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                      Fyll i det som ska synas i dokument, PDF och företagsprofil. Du kan lämna resten tomt tills vidare.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Street */}
                  <div>
                    <label className={labelCls}>Gatuadress</label>
                    <input value={form.addressLine1} onChange={set('addressLine1')} placeholder="Testgatan 42" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Adressrad 2</label>
                    <input value={form.addressLine2} onChange={set('addressLine2')} placeholder="Lokal 2, c/o" className={inputCls} />
                  </div>
                  {/* Postal + City */}
                  <div className="grid grid-cols-[120px_1fr] gap-3">
                    <div>
                      <label className={labelCls}>Postnummer</label>
                      <input value={form.postalCode} onChange={set('postalCode')} placeholder="702 24" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Stad</label>
                      <input value={form.city} onChange={set('city')} placeholder="Örebro" className={inputCls} />
                    </div>
                  </div>
                  {/* Region + Country */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Län / region</label>
                      <input value={form.region} onChange={set('region')} placeholder="Örebro län" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Land</label>
                      <input value={form.country} onChange={set('country')} placeholder="Sverige" className={inputCls} />
                    </div>
                  </div>
                  {/* Website */}
                  <div>
                    <label className={labelCls}>Webbplats</label>
                    <input type="url" value={form.website} onChange={set('website')} placeholder="soleria.se" className={inputCls} />
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-5 xl:sticky xl:top-0 xl:self-start">
              <section className={cardCls}>
                <div className="mb-4 flex items-start gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                    <IdentificationCard size={18} weight="duotone" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Så syns företaget i offerten</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                      Förhandsvisningen nedan motsvarar innehållet i offertens övre vänsterdel.
                    </p>
                  </div>
                </div>

                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-alt)] p-4">
                  <div className="space-y-1.5 text-sm leading-6 text-[var(--text-secondary)]">
                    {companyPreviewLines.length > 0 ? (
                      companyPreviewLines.map((line) => (
                        <p key={line} className={line === form.name.trim() ? 'font-semibold text-[var(--text-primary)]' : ''}>
                          {line}
                        </p>
                      ))
                    ) : (
                      <p>Fyll i företagsnamn, org.nr och adress för att se hur toppen av offerten fylls.</p>
                    )}
                  </div>
                </div>
              </section>

              <section className={cardCls}>
                <div className="mb-4 flex items-start gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                    <Globe size={18} weight="duotone" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Logga och profil</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                      Loggan används i offert, PDF och vissa mejlhuvuden.
                    </p>
                  </div>
                </div>

                <CompanyLogoUpload
                  value={form.logoUrl}
                  onChange={(logoUrl) => setForm((current) => ({ ...current, logoUrl }))}
                />
              </section>

            </aside>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-[var(--border)] px-5 pb-5 pt-3 sm:px-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            type="button"
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim()}
          >
            {saving ? 'Sparar…' : company ? 'Spara ändringar' : 'Skapa företag'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

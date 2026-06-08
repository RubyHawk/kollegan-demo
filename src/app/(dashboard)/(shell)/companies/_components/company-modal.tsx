'use client';

import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { Building2, Globe, IdCard, MapPin } from 'lucide-react';
import type { Company } from '@shared/lib/api/companies.api';
import { Button } from '@shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ModalActionFooter,
  ModalBody,
  ModalFormGrid,
  ModalMetaCard,
  ModalSection,
} from '@shared/ui/dialog';
import { Input } from '@shared/ui/input';
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

  const setField =
    (key: keyof CompanyForm) =>
    (event: ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

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
        size="xl"
        showMobileClose
        className="sm:max-h-[96dvh] sm:max-w-[1160px]"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-[var(--ui-border)] pr-16 sm:gap-1 sm:pb-3">
            <DialogTitle className="text-xl">
              {company ? 'Redigera företag' : 'Nytt företag'}
            </DialogTitle>
            <DialogDescription className="max-w-2xl sm:leading-5">
              Samla företagets identitet, adress och logotyp i ett läsbart flöde. Huvudformuläret ligger till
              vänster och offertförhandsvisningen håller sig lugnare i stödkolumnen.
            </DialogDescription>
          </DialogHeader>

          <ModalBody className="sm:py-4">
            <ModalFormGrid columns="sidebar" className="items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-4">
                <ModalSection tone="card" className="sm:space-y-3.5 sm:p-4">
                  <SectionIntro
                    icon={Building2}
                    title="Företagsidentitet"
                    description="Det här visas i offertens avsändarblock och i företagets dokumentmallar."
                  />

                  <ModalFormGrid columns="two">
                    <Field label="Namn *">
                      <Input value={form.name} onChange={setField('name')} placeholder="Soleria AB" />
                    </Field>
                    <Field label="Organisationsnummer">
                      <Input value={form.orgNumber} onChange={setField('orgNumber')} placeholder="556677-8899" />
                    </Field>
                  </ModalFormGrid>
                </ModalSection>

                <ModalSection tone="card" className="sm:space-y-3.5 sm:p-4">
                  <SectionIntro
                    icon={MapPin}
                    title="Adress och kontakt"
                    description="Fyll i de uppgifter som ska synas i dokument, PDF och företagsprofil."
                  />

                  <div className="space-y-3.5">
                    <Field label="Gatuadress">
                      <Input value={form.addressLine1} onChange={setField('addressLine1')} placeholder="Testgatan 42" />
                    </Field>
                    <Field label="Adressrad 2">
                      <Input value={form.addressLine2} onChange={setField('addressLine2')} placeholder="Lokal 2, c/o" />
                    </Field>
                    <ModalFormGrid columns="three">
                      <Field label="Postnummer">
                        <Input value={form.postalCode} onChange={setField('postalCode')} placeholder="702 24" />
                      </Field>
                      <Field label="Stad" className="md:col-span-2">
                        <Input value={form.city} onChange={setField('city')} placeholder="Örebro" />
                      </Field>
                    </ModalFormGrid>
                    <ModalFormGrid columns="two">
                      <Field label="Län / region">
                        <Input value={form.region} onChange={setField('region')} placeholder="Örebro län" />
                      </Field>
                      <Field label="Land">
                        <Input value={form.country} onChange={setField('country')} placeholder="Sverige" />
                      </Field>
                    </ModalFormGrid>
                    <Field label="Webbplats">
                      <Input type="url" value={form.website} onChange={setField('website')} placeholder="soleria.se" />
                    </Field>
                  </div>
                </ModalSection>
              </div>

              <div className="space-y-4 xl:sticky xl:top-0">
                <ModalSection tone="card" className="sm:space-y-3.5 sm:p-4">
                  <SectionIntro
                    icon={IdCard}
                    title="Så syns företaget i offerten"
                    description="Förhandsvisningen motsvarar innehållet i offertens övre vänsterdel."
                  />

                  <ModalMetaCard className="shadow-none">
                    <div className="space-y-1.5 text-sm leading-6 text-[var(--ui-text-secondary)]">
                      {companyPreviewLines.length > 0 ? (
                        companyPreviewLines.map((line) => (
                          <p key={line} className={line === form.name.trim() ? 'font-semibold text-[var(--ui-text)]' : ''}>
                            {line}
                          </p>
                        ))
                      ) : (
                        <p>Fyll i företagsnamn, org.nr och adress för att se hur toppen av offerten fylls.</p>
                      )}
                    </div>
                  </ModalMetaCard>
                </ModalSection>

                <ModalSection tone="card" className="sm:space-y-3.5 sm:p-4">
                  <SectionIntro
                    icon={Globe}
                    title="Logga och profil"
                    description="Loggan används i offert, PDF och vissa mejlhuvuden."
                  />

                  <CompanyLogoUpload
                    value={form.logoUrl}
                    onChange={(logoUrl) => setForm((current) => ({ ...current, logoUrl }))}
                  />

                  <Button type="button" variant="ghost" className="w-full justify-start" onClick={onOpenTemplates}>
                    Öppna mallar för företagets dokument
                  </Button>
                </ModalSection>
              </div>
            </ModalFormGrid>
          </ModalBody>

          <ModalActionFooter className="sm:pb-4 sm:pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button type="button" onClick={() => onSave(form)} disabled={saving || !form.name.trim()} loading={saving}>
              {company ? 'Spara ändringar' : 'Skapa företag'}
            </Button>
          </ModalActionFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionIntro({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-accent)]">
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--ui-text)]">{title}</p>
        <p className="text-sm leading-5 text-[var(--ui-text-muted)]">{description}</p>
      </div>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium text-[var(--ui-text-secondary)]">{label}</span>
      {children}
    </label>
  );
}

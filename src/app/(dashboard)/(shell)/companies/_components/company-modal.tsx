'use client';

import { useMemo, useState } from 'react';
import { Buildings, Globe, IdentificationCard, MapPinLine } from '@phosphor-icons/react';
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
import { CustomFieldsSection } from '@shared/ui/custom-fields-section';
import { useCustomFieldDefinitions } from '@shared/lib/custom-fields/use-custom-field-definitions';
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
  customFields: Record<string, unknown>;
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
  customFields: {},
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
    customFields: company.customFields ?? {},
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
  const { definitions: customFieldDefs } = useCustomFieldDefinitions('company');

  const setField =
    (key: keyof CompanyForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const inputCls =
    'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none';
  const labelCls = 'mb-1.5 block text-xs font-medium text-[var(--text-secondary)]';

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
          <DialogHeader className="border-b border-[var(--border)] pr-16 sm:gap-1 sm:pb-3">
            <DialogTitle className="text-xl">
              {company ? 'Redigera företag' : 'Nytt företag'}
            </DialogTitle>
            <DialogDescription className="max-w-2xl sm:leading-5">
              Samla företagets identitet, adress och logotyp i ett mer läsbart flöde. Huvudformuläret ligger till
              vänster och offertförhandsvisningen håller sig lugnare i stödkolumnen.
            </DialogDescription>
          </DialogHeader>

          <ModalBody className="sm:py-4">
            <ModalFormGrid columns="sidebar" className="items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-4">
                <ModalSection tone="card" className="sm:space-y-3.5 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                      <Buildings size={18} weight="duotone" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Företagsidentitet</p>
                      <p className="text-sm leading-5 text-[var(--text-muted)]">
                        Det här visas i offertens avsändarblock och i företagets dokumentmallar.
                      </p>
                    </div>
                  </div>

                  <ModalFormGrid columns="two">
                    <div>
                      <label className={labelCls}>Namn *</label>
                      <input value={form.name} onChange={setField('name')} placeholder="Soleria AB" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Organisationsnummer</label>
                      <input
                        value={form.orgNumber}
                        onChange={setField('orgNumber')}
                        placeholder="556677-8899"
                        className={inputCls}
                      />
                    </div>
                  </ModalFormGrid>
                </ModalSection>

                <ModalSection tone="card" className="sm:space-y-3.5 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                      <MapPinLine size={18} weight="duotone" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Adress och kontakt</p>
                      <p className="text-sm leading-5 text-[var(--text-muted)]">
                        Fyll i de uppgifter som ska synas i dokument, PDF och företagsprofil.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className={labelCls}>Gatuadress</label>
                      <input
                        value={form.addressLine1}
                        onChange={setField('addressLine1')}
                        placeholder="Testgatan 42"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Adressrad 2</label>
                      <input
                        value={form.addressLine2}
                        onChange={setField('addressLine2')}
                        placeholder="Lokal 2, c/o"
                        className={inputCls}
                      />
                    </div>
                    <ModalFormGrid columns="three">
                      <div>
                        <label className={labelCls}>Postnummer</label>
                        <input
                          value={form.postalCode}
                          onChange={setField('postalCode')}
                          placeholder="702 24"
                          className={inputCls}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelCls}>Stad</label>
                        <input
                          value={form.city}
                          onChange={setField('city')}
                          placeholder="Örebro"
                          className={inputCls}
                        />
                      </div>
                    </ModalFormGrid>
                    <ModalFormGrid columns="two">
                      <div>
                        <label className={labelCls}>Län / region</label>
                        <input
                          value={form.region}
                          onChange={setField('region')}
                          placeholder="Örebro län"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Land</label>
                        <input
                          value={form.country}
                          onChange={setField('country')}
                          placeholder="Sverige"
                          className={inputCls}
                        />
                      </div>
                    </ModalFormGrid>
                    <div>
                      <label className={labelCls}>Webbplats</label>
                      <input
                        type="url"
                        value={form.website}
                        onChange={setField('website')}
                        placeholder="soleria.se"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </ModalSection>

                {customFieldDefs.length > 0 && (
                  <ModalSection tone="card" className="sm:space-y-3.5 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                        <IdentificationCard size={18} weight="duotone" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Anpassade fält</p>
                        <p className="text-sm leading-5 text-[var(--text-muted)]">
                          Extra fält som din organisation har lagt till för företag.
                        </p>
                      </div>
                    </div>

                    <CustomFieldsSection
                      definitions={customFieldDefs}
                      values={form.customFields}
                      onChange={(customFields) => setForm((current) => ({ ...current, customFields }))}
                    />
                  </ModalSection>
                )}
              </div>

              <div className="space-y-4 xl:sticky xl:top-0">
                <ModalSection tone="card" className="sm:space-y-3.5 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                      <IdentificationCard size={18} weight="duotone" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Så syns företaget i offerten</p>
                      <p className="text-sm leading-5 text-[var(--text-muted)]">
                        Förhandsvisningen motsvarar innehållet i offertens övre vänsterdel.
                      </p>
                    </div>
                  </div>

                  <ModalMetaCard className="shadow-none">
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
                  </ModalMetaCard>
                </ModalSection>

                <ModalSection tone="card" className="sm:space-y-3.5 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                      <Globe size={18} weight="duotone" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Logga och profil</p>
                      <p className="text-sm leading-5 text-[var(--text-muted)]">
                        Loggan används i offert, PDF och vissa mejlhuvuden.
                      </p>
                    </div>
                  </div>

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
            <Button type="button" onClick={() => onSave(form)} disabled={saving || !form.name.trim()}>
              {saving ? 'Sparar…' : company ? 'Spara ändringar' : 'Skapa företag'}
            </Button>
          </ModalActionFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { ArrowRight, ExternalLink, FileText, LoaderCircle, Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { CompanyScopeSelector } from '@shared/ui/company-scope-selector';
import type { ActiveCompanyOption } from '@shared/hooks/use-active-company';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { Input } from '@shared/ui/input';
import type { CompanyResult, ContactResult, OfferForm, OfferTemplate } from '../_store/types';
import { OfferTemplateCard } from './offer-template-card';

type OfferFormSetter = (form: OfferForm | ((prev: OfferForm) => OfferForm)) => void;
type StringSetter = (value: string) => void;
type NullableStringSetter = (value: string | null) => void;
type ContactsSetter = (value: ContactResult[]) => void;
type CompaniesSetter = (value: CompanyResult[]) => void;
type WizardStep = 1 | 2;
type ConfirmedSection = 'mottagare' | 'detaljer';
type SectionsSetter = (
  value: Set<ConfirmedSection> | ((prev: Set<ConfirmedSection>) => Set<ConfirmedSection>)
) => void;

type OfferWizardStepOneProps = {
  companies: ActiveCompanyOption[];
  form: OfferForm;
  selectedCompanyId: string;
  templates: OfferTemplate[];
  contactSearch: string;
  contactResults: ContactResult[];
  contactLoading: boolean;
  companyResults: CompanyResult[];
  companyLoading: boolean;
  closeWizard: () => void;
  setSelectedCompanyId: StringSetter;
  setForm: OfferFormSetter;
  setLivePreviewHtml: NullableStringSetter;
  setCachedTplContent: NullableStringSetter;
  selectTemplate: (templateId: string) => void | Promise<void>;
  openTemplatePreview: (templateId?: string) => void | Promise<void>;
  searchContacts: StringSetter;
  setContactSearch: StringSetter;
  setContactResults: ContactsSetter;
  pickContact: (contact: ContactResult) => void;
  searchCompanies: StringSetter;
  setCompanyResults: CompaniesSetter;
  setWizardStep: (step: WizardStep) => void;
  setConfirmedSections: SectionsSetter;
};

export function OfferWizardStepOne({
  companies,
  form,
  selectedCompanyId,
  templates,
  contactSearch,
  contactResults,
  contactLoading,
  companyResults,
  companyLoading,
  closeWizard,
  setSelectedCompanyId,
  setForm,
  setLivePreviewHtml,
  setCachedTplContent,
  selectTemplate,
  openTemplatePreview,
  searchContacts,
  setContactSearch,
  setContactResults,
  pickContact,
  searchCompanies,
  setCompanyResults,
  setWizardStep,
  setConfirmedSections,
}: OfferWizardStepOneProps) {
  const selectedContactName = contactResults.find((contact) => contact.id === form.contactId || contact.leadId === form.leadId)?.name;
  const contactInputValue = form.contactId || form.leadId
    ? selectedContactName ?? (contactSearch || 'Kontakt vald')
    : contactSearch;

  return (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-5 py-3.5">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[var(--ui-text)]">Ny offert</h3>
          <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">Välj mall och mottagare</p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={closeWizard} title="Stäng" className="shrink-0 lg:hidden" aria-label="Stäng">
          <X size={16} strokeWidth={1.75} aria-hidden />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {companies.length > 0 ? (
          <CompanyScopeSelector
            companies={companies}
            selectedCompanyId={form.companyId || selectedCompanyId}
            onSelect={(companyId) => {
              setSelectedCompanyId(companyId);
              setForm((current) => ({ ...current, companyId, templateId: '' }));
              setLivePreviewHtml(null);
              setCachedTplContent(null);
            }}
            compact
            title="Säljande företag"
            description="Det här företaget styr mallar, produkter och branding i offerten."
          />
        ) : null}

        <p className="px-1 text-[10px] font-semibold uppercase text-[var(--ui-text-muted)]">Mall</p>
        {templates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Inga mallar ännu"
            description="Skapa en offertmall innan du skapar en offert."
          />
        ) : (
          templates.map((template) => (
            <OfferTemplateCard
              key={template.id}
              template={template}
              selected={form.templateId === template.id}
              onSelect={() => void selectTemplate(template.id)}
              onPreview={() => void openTemplatePreview(template.id)}
            />
          ))
        )}
        {templates.length === 0 ? (
          <div className="flex justify-center">
            <Button asChild>
              <a href="/mallar" target="_blank" rel="noreferrer">
                Skapa mall
                <ExternalLink size={16} strokeWidth={1.75} aria-hidden />
              </a>
            </Button>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-[var(--ui-border)] bg-[var(--ui-surface-subtle)]">
        <div className="space-y-2.5 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase text-[var(--ui-text-muted)]">Mottagare</p>

          <div className="relative">
            <Search size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--ui-text-muted)]" aria-hidden />
            <Input
              value={contactInputValue}
              onChange={(event) => {
                if (form.contactId || form.leadId) setForm((current) => ({ ...current, contactId: '', leadId: '' }));
                searchContacts(event.target.value);
              }}
              placeholder="Sök kontakt eller lead för autofyll..."
              className="h-9 pl-9 pr-9 text-xs"
            />
            {(contactSearch || form.contactId || form.leadId) ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setForm((current) => ({ ...current, contactId: '', leadId: '' }));
                  setContactSearch('');
                  setContactResults([]);
                }}
                className="absolute right-1 top-1/2 z-10 size-7 -translate-y-1/2 text-[var(--ui-text-muted)]"
                aria-label="Rensa vald kontakt"
              >
                <X size={14} strokeWidth={1.75} aria-hidden />
              </Button>
            ) : null}
            {contactSearch && !form.contactId && !form.leadId ? (
              <LookupMenu placement="top">
                {contactLoading ? (
                  <LookupLoading label="Söker..." />
                ) : contactResults.length === 0 ? (
                  <LookupEmpty label="Inga kontakter hittades" />
                ) : (
                  contactResults.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => pickContact(contact)}
                      className="flex w-full items-center gap-3 border-b border-[var(--ui-border)] px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
                    >
                      <ResultAvatar label={contact.name ?? '?'} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-[var(--ui-text)]">{contact.name ?? '-'}</span>
                        <span className="block truncate text-[10px] text-[var(--ui-text-muted)]">
                          {[contact.kind === 'lead' ? 'Lead' : 'Kund', contact.email, contact.requestedService ?? contact.company, contact.hasOffer ? 'Har offert' : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </LookupMenu>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              value={form.recipientName}
              onChange={(event) => setForm((current) => ({ ...current, recipientName: event.target.value }))}
              placeholder="Namn *"
              className="h-9 text-xs"
            />
            <Input
              type="email"
              value={form.recipientEmail}
              onChange={(event) => setForm((current) => ({ ...current, recipientEmail: event.target.value }))}
              placeholder="E-post *"
              className="h-9 text-xs"
            />
          </div>

          <div className="relative">
            <Input
              value={form.recipientCompany}
              onChange={(event) => {
                setForm((current) => ({ ...current, recipientCompany: event.target.value }));
                searchCompanies(event.target.value);
              }}
              onFocus={() => {
                if (form.recipientCompany) searchCompanies(form.recipientCompany);
              }}
              onBlur={() => setTimeout(() => setCompanyResults([]), 150)}
              placeholder="Företag (valfri)"
              className="h-9 text-xs"
            />
            {(companyResults.length > 0 || companyLoading) ? (
              <LookupMenu placement="top">
                {companyLoading ? (
                  <LookupLoading label="Söker..." />
                ) : (
                  companyResults.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setForm((current) => ({ ...current, recipientCompany: company.name }));
                        setCompanyResults([]);
                      }}
                      className="flex w-full items-center gap-3 border-b border-[var(--ui-border)] px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-[var(--ui-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
                    >
                      <ResultAvatar label={company.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-[var(--ui-text)]">{company.name}</span>
                        {company.orgNumber ? <span className="block text-[10px] text-[var(--ui-text-muted)]">{company.orgNumber}</span> : null}
                      </span>
                    </button>
                  ))
                )}
              </LookupMenu>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--ui-border)] px-4 py-3">
          <Button asChild variant="link" className="h-auto text-xs text-[var(--ui-text-muted)]">
            <a href="/mallar" target="_blank" rel="noreferrer">
              Hantera mallar
              <ExternalLink size={14} strokeWidth={1.75} aria-hidden />
            </a>
          </Button>
          <Button
            type="button"
            disabled={!form.templateId || !form.recipientName.trim()}
            onClick={() => {
              setConfirmedSections((sections) => {
                const next = new Set(sections);
                next.add('mottagare');
                return next;
              });
              setWizardStep(2);
            }}
          >
            Fortsätt
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
          </Button>
        </div>
      </div>
    </>
  );
}

function LookupMenu({ children, placement }: { children: ReactNode; placement: 'top' | 'bottom' }) {
  return (
    <div className={`${placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} absolute left-0 right-0 z-50 max-h-48 overflow-y-auto rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-raised)]`}>
      {children}
    </div>
  );
}

function LookupLoading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 text-xs text-[var(--ui-text-muted)]">
      <LoaderCircle size={16} strokeWidth={1.75} className="shrink-0 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

function LookupEmpty({ label }: { label: string }) {
  return <div className="px-4 py-3 text-xs text-[var(--ui-text-muted)]">{label}</div>;
}

function ResultAvatar({ label }: { label: string }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] text-[10px] font-semibold text-[var(--ui-accent)]">
      {(label || '?').charAt(0).toUpperCase()}
    </span>
  );
}

'use client';

import { Check, ChevronDown, LoaderCircle, Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import type { CompanyResult, ContactResult, OfferForm } from '../_store/types';

type OfferFormSetter = (form: OfferForm | ((prev: OfferForm) => OfferForm)) => void;
type FieldErrorsSetter = (errors: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
type NullableStringSetter = (value: string | null) => void;
type StringSetter = (value: string) => void;
type ContactsSetter = (value: ContactResult[]) => void;
type CompaniesSetter = (value: CompanyResult[]) => void;
type OpenCards = { mottagare: boolean; detaljer: boolean };
type OpenCardsSetter = (updater: OpenCards | ((prev: OpenCards) => OpenCards)) => void;
type ConfirmedSection = 'mottagare' | 'detaljer';
type ConfirmedSectionsSetter = (
  updater: Set<ConfirmedSection> | ((prev: Set<ConfirmedSection>) => Set<ConfirmedSection>)
) => void;

type OfferWizardRecipientCardProps = {
  form: OfferForm;
  fieldErrors: Record<string, string>;
  openCards: OpenCards;
  confirmedSections: Set<ConfirmedSection>;
  contactSearch: string;
  contactResults: ContactResult[];
  contactLoading: boolean;
  companyResults: CompanyResult[];
  companyLoading: boolean;
  mottagareComplete: boolean;
  setForm: OfferFormSetter;
  setFieldErrors: FieldErrorsSetter;
  setOpenCards: OpenCardsSetter;
  setConfirmedSections: ConfirmedSectionsSetter;
  setActiveField: NullableStringSetter;
  searchContacts: StringSetter;
  setContactSearch: StringSetter;
  setContactResults: ContactsSetter;
  pickContact: (contact: ContactResult) => void;
  searchCompanies: StringSetter;
  setCompanyResults: CompaniesSetter;
};

export function OfferWizardRecipientCard({
  form,
  fieldErrors,
  openCards,
  confirmedSections,
  contactSearch,
  contactResults,
  contactLoading,
  companyResults,
  companyLoading,
  mottagareComplete,
  setForm,
  setFieldErrors,
  setOpenCards,
  setConfirmedSections,
  setActiveField,
  searchContacts,
  setContactSearch,
  setContactResults,
  pickContact,
  searchCompanies,
  setCompanyResults,
}: OfferWizardRecipientCardProps) {
  const recipientConfirmed = confirmedSections.has('mottagare');
  const selectedContactName = contactResults.find((contact) => contact.id === form.contactId || contact.leadId === form.leadId)?.name;
  const contactInputValue = form.contactId || form.leadId
    ? selectedContactName ?? (contactSearch || 'Kontakt vald')
    : contactSearch;

  return (
    <div
      className={cn(
        'rounded-[var(--ui-radius-lg)] border bg-[var(--ui-surface)] transition-colors',
        openCards.mottagare ? 'border-[var(--ui-border)]' : 'border-[var(--ui-border-subtle)]',
      )}
    >
      <button
        type="button"
        onClick={() => setOpenCards((cards) => ({ ...cards, mottagare: !cards.mottagare }))}
        className="flex w-full items-center gap-3 px-4 pb-3 pt-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
      >
        <span
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded-full transition-colors',
            recipientConfirmed
              ? 'bg-[var(--ui-success-text)] text-[var(--ui-text-inverse)]'
              : 'border-2 border-[var(--ui-accent)]',
          )}
        >
          {recipientConfirmed ? <Check size={10} strokeWidth={2.5} aria-hidden /> : null}
        </span>
        <span className="flex-1 text-xs font-semibold uppercase text-[var(--ui-text-secondary)]">Mottagare</span>
        {!openCards.mottagare && recipientConfirmed ? (
          <span className="max-w-[100px] truncate text-xs text-[var(--ui-text-muted)]">{form.recipientName}</span>
        ) : null}
        {recipientConfirmed && !openCards.mottagare ? (
          <span className="shrink-0 text-[10px] text-[var(--ui-accent)]">Redigera</span>
        ) : (
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            className={cn('shrink-0 text-[var(--ui-text-muted)] transition-transform', openCards.mottagare ? 'rotate-180' : '')}
            aria-hidden
          />
        )}
      </button>

      <AnimatePresence>
        {!openCards.mottagare && recipientConfirmed ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--ui-border)] px-4 pb-3.5 pt-2.5">
              <p className="text-sm font-medium text-[var(--ui-text)]">{form.recipientName}</p>
              <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                {form.recipientEmail}{form.recipientCompany ? ` · ${form.recipientCompany}` : ''}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {openCards.mottagare ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-[var(--ui-border)] px-4 pb-4 pt-3">
              <div className="relative">
                <Search
                  size={16}
                  strokeWidth={1.75}
                  className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--ui-text-muted)]"
                  aria-hidden
                />
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
                  <LookupMenu>
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

              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-[var(--ui-text-secondary)]">Namn *</label>
                  <Input
                    value={form.recipientName}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, recipientName: event.target.value }));
                      setFieldErrors((errors) => ({ ...errors, recipientName: '' }));
                    }}
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (!value) setFieldErrors((errors) => ({ ...errors, recipientName: 'Obligatoriskt' }));
                      else if (value.length < 2) setFieldErrors((errors) => ({ ...errors, recipientName: 'Minst 2 tecken' }));
                    }}
                    onFocus={() => setActiveField('Mottagare')}
                    placeholder="Namn"
                    aria-invalid={fieldErrors.recipientName ? true : undefined}
                    className={cn('h-9 text-xs', fieldErrors.recipientName && 'border-[var(--ui-danger-border)]')}
                  />
                  {fieldErrors.recipientName ? <p className="mt-0.5 text-[10px] text-[var(--ui-danger-text)]">{fieldErrors.recipientName}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-[var(--ui-text-secondary)]">E-post *</label>
                  <Input
                    type="email"
                    value={form.recipientEmail}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, recipientEmail: event.target.value }));
                      setFieldErrors((errors) => ({ ...errors, recipientEmail: '' }));
                    }}
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (!value) setFieldErrors((errors) => ({ ...errors, recipientEmail: 'Obligatoriskt' }));
                      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) setFieldErrors((errors) => ({ ...errors, recipientEmail: 'Ogiltig e-postadress' }));
                    }}
                    onFocus={() => setActiveField('E-post')}
                    placeholder="namn@foretag.se"
                    aria-invalid={fieldErrors.recipientEmail ? true : undefined}
                    className={cn('h-9 text-xs', fieldErrors.recipientEmail && 'border-[var(--ui-danger-border)]')}
                  />
                  {fieldErrors.recipientEmail ? <p className="mt-0.5 text-[10px] text-[var(--ui-danger-text)]">{fieldErrors.recipientEmail}</p> : null}
                </div>
              </div>

              <div className="relative">
                <label className="mb-1 block text-[10px] font-medium text-[var(--ui-text-secondary)]">Företag</label>
                <Input
                  value={form.recipientCompany}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, recipientCompany: event.target.value }));
                    searchCompanies(event.target.value);
                  }}
                  onFocus={() => {
                    setActiveField('Mottagare');
                    if (form.recipientCompany) searchCompanies(form.recipientCompany);
                  }}
                  onBlur={() => setTimeout(() => setCompanyResults([]), 150)}
                  placeholder="Företag"
                  className="h-9 text-xs"
                />
                {(companyResults.length > 0 || companyLoading) ? (
                  <LookupMenu>
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

              <div className="mt-1 flex items-center justify-end border-t border-[var(--ui-border)] pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!mottagareComplete}
                  onClick={() => {
                    if (mottagareComplete) {
                      setConfirmedSections((sections) => {
                        const next = new Set(sections);
                        next.add('mottagare');
                        return next;
                      });
                      setOpenCards((cards) => ({ ...cards, mottagare: false }));
                    }
                  }}
                >
                  <Check size={16} strokeWidth={1.75} aria-hidden />
                  Klar
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function LookupMenu({ children }: { children: ReactNode }) {
  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-raised)]">
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

'use client';

import { CompanyScopeSelector } from '@shared/ui/company-scope-selector';
import type { ActiveCompanyOption } from '@shared/hooks/use-active-company';
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
  return (
                  <>
                    {/* Header */}
                    <div className="px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface-alt)] shrink-0 flex items-center gap-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Ny offert</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Välj mall och mottagare</p>
                      </div>
                      <button onClick={closeWizard} title="Stäng"
                        className="lg:hidden shrink-0 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-active)] transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>

                    {/* Template list — scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                      {companies.length > 0 && (
                        <div className="mb-4">
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
                        </div>
                      )}
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1 mb-3">Mall</p>
                      {templates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center gap-4 px-4">
                          <div className="w-14 h-14 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Inga mallar ännu</p>
                            <p className="text-xs text-[var(--text-muted)]">Skapa en offertmall innan du skapar en offert.</p>
                          </div>
                          <a href="/mallar" target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
                            Skapa mall
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                            </svg>
                          </a>
                        </div>
                      ) : (
                        templates.map((t) => (
                          <OfferTemplateCard
                            key={t.id}
                            template={t}
                            selected={form.templateId === t.id}
                            onSelect={() => void selectTemplate(t.id)}
                            onPreview={() => void openTemplatePreview(t.id)}
                          />
                        ))
                      )}
                    </div>

                    {/* Recipient section — fixed at bottom */}
                    <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface-alt)]">
                      <div className="px-4 py-3 space-y-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Mottagare</p>

                        {/* Contact search */}
                        <div className="relative">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          </svg>
                          <input
                            value={form.contactId || form.leadId ? (contactResults.find((c) => c.id === form.contactId || c.leadId === form.leadId)?.name ?? (contactSearch || 'Kontakt vald')) : contactSearch}
                            onChange={(e) => { if (form.contactId || form.leadId) setForm((f) => ({ ...f, contactId: '', leadId: '' })); searchContacts(e.target.value); }}
                            placeholder="Sök kontakt eller lead för autofyll…"
                            className="w-full pl-8 pr-8 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
                          />
                          {(contactSearch || form.contactId || form.leadId) && (
                            <button type="button" onClick={() => { setForm((f) => ({ ...f, contactId: '', leadId: '' })); setContactSearch(''); setContactResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors z-10">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          )}
                          {contactSearch && !form.contactId && !form.leadId && (
                            <div className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                              {contactLoading ? (
                                <div className="flex items-center gap-2 px-4 py-3 text-xs text-[var(--text-muted)]">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin shrink-0">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                  </svg>
                                  Söker…
                                </div>
                              ) : contactResults.length === 0 ? (
                                <div className="px-4 py-3 text-xs text-[var(--text-muted)]">Inga kontakter hittades</div>
                              ) : (
                                contactResults.map((c) => (
                                  <button key={c.id} type="button" onClick={() => pickContact(c)} className="w-full text-left px-4 py-2.5 hover:bg-[var(--surface-active)] transition-colors flex items-center gap-3 border-b border-[var(--border)] last:border-0">
                                    <div className="w-6 h-6 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] text-[10px] font-semibold shrink-0">
                                      {(c.name ?? '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">{c.name ?? '—'}</p>
                                      <p className="text-[10px] text-[var(--text-muted)] truncate">
                                        {[c.kind === 'lead' ? 'Lead' : 'Kund', c.email, c.requestedService ?? c.company, c.hasOffer ? 'Har offert' : null].filter(Boolean).join(' · ')}
                                      </p>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        {/* Name + email quick fields */}
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={form.recipientName}
                            onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
                            placeholder="Namn *"
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
                          />
                          <input
                            type="email"
                            value={form.recipientEmail}
                            onChange={(e) => setForm((f) => ({ ...f, recipientEmail: e.target.value }))}
                            placeholder="E-post *"
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
                          />
                        </div>

                        {/* Company typeahead */}
                        <div className="relative">
                          <input
                            value={form.recipientCompany}
                            onChange={(e) => { setForm((f) => ({ ...f, recipientCompany: e.target.value })); searchCompanies(e.target.value); }}
                            onFocus={() => { if (form.recipientCompany) searchCompanies(form.recipientCompany); }}
                            onBlur={() => setTimeout(() => setCompanyResults([]), 150)}
                            placeholder="Företag (valfri)"
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
                          />
                          {(companyResults.length > 0 || companyLoading) && (
                            <div className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
                              {companyLoading ? (
                                <div className="flex items-center gap-2 px-4 py-3 text-xs text-[var(--text-muted)]">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin shrink-0"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                  Söker…
                                </div>
                              ) : companyResults.map((co) => (
                                <button key={co.id} type="button"
                                  onMouseDown={(e) => { e.preventDefault(); setForm((f) => ({ ...f, recipientCompany: co.name })); setCompanyResults([]); }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-[var(--surface-active)] transition-colors flex items-center gap-3 border-b border-[var(--border)] last:border-0">
                                  <div className="w-6 h-6 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] text-[10px] font-semibold shrink-0">
                                    {co.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">{co.name}</p>
                                    {co.orgNumber && <p className="text-[10px] text-[var(--text-muted)]">{co.orgNumber}</p>}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Proceed footer */}
                      <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between gap-3">
                        <a href="/mallar" target="_blank" rel="noreferrer"
                          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                          Hantera mallar →
                        </a>
                        <button
                          type="button"
                          disabled={!form.templateId || !form.recipientName.trim()}
                          onClick={() => {
                            setConfirmedSections((s) => { const n = new Set(s); n.add('mottagare'); return n; });
                            setWizardStep(2);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                          Fortsätt
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
  );
}

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
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
  return (
                        <div className={cn('rounded-xl border bg-[var(--surface)] transition-all duration-200', openCards.mottagare ? 'border-[var(--border)] shadow-sm' : 'border-[var(--border)]/60')}>
                          <div onClick={() => setOpenCards((o) => ({ ...o, mottagare: !o.mottagare }))} className="flex items-center gap-3 px-4 pt-3.5 pb-3 cursor-pointer select-none">
                            <div className={cn('w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-300', confirmedSections.has('mottagare') ? 'bg-emerald-500' : 'border-2 border-[var(--accent)]')}>
                              {confirmedSections.has('mottagare') && (
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                            </div>
                            <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Mottagare</span>
                            {!openCards.mottagare && confirmedSections.has('mottagare') && (
                              <span className="text-xs text-[var(--text-muted)] truncate max-w-[100px]">{form.recipientName}</span>
                            )}
                            {confirmedSections.has('mottagare') && !openCards.mottagare ? (
                              <span className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors shrink-0">Redigera</span>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('shrink-0 text-[var(--text-muted)] transition-transform', openCards.mottagare ? 'rotate-180' : '')}>
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            )}
                          </div>
                          <AnimatePresence>
                            {!openCards.mottagare && confirmedSections.has('mottagare') && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden">
                                <div className="px-4 pb-3.5 border-t border-[var(--border)]/30 pt-2.5">
                                  <p className="text-sm text-[var(--text-primary)] font-medium">{form.recipientName}</p>
                                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{form.recipientEmail}{form.recipientCompany ? ` · ${form.recipientCompany}` : ''}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <AnimatePresence>
                            {openCards.mottagare && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden">
                                <div className="px-4 pt-3 pb-4 space-y-3 border-t border-[var(--border)]/40">
                                  <div className="relative">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10">
                                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                    </svg>
                                    <input value={form.contactId || form.leadId ? (contactResults.find((c) => c.id === form.contactId || c.leadId === form.leadId)?.name ?? (contactSearch || 'Kontakt vald')) : contactSearch} onChange={(e) => { if (form.contactId || form.leadId) setForm((f) => ({ ...f, contactId: '', leadId: '' })); searchContacts(e.target.value); }} placeholder="Sök kontakt eller lead för autofyll…" className="w-full pl-8 pr-8 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"/>
                                    {(contactSearch || form.contactId || form.leadId) && (
                                      <button type="button" onClick={() => { setForm((f) => ({ ...f, contactId: '', leadId: '' })); setContactSearch(''); setContactResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors z-10">
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                        </svg>
                                      </button>
                                    )}
                                    {contactSearch && !form.contactId && !form.leadId && (
                                      <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
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
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-medium text-[var(--text-secondary)] mb-1">Namn *</label>
                                      <input value={form.recipientName} onChange={(e) => { setForm((f) => ({ ...f, recipientName: e.target.value })); setFieldErrors((fe) => ({ ...fe, recipientName: '' })); }} onBlur={(e) => { const v = e.target.value.trim(); if (!v) setFieldErrors((fe) => ({ ...fe, recipientName: 'Obligatoriskt' })); else if (v.length < 2) setFieldErrors((fe) => ({ ...fe, recipientName: 'Minst 2 tecken' })); }} onFocus={() => setActiveField('Mottagare')} placeholder="Namn" className={`w-full rounded-lg border px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15 transition-all bg-[var(--surface-alt)] ${fieldErrors.recipientName ? 'border-red-400' : 'border-[var(--border)] focus:border-[var(--accent)]'}`}/>
                                      {fieldErrors.recipientName && <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.recipientName}</p>}
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-medium text-[var(--text-secondary)] mb-1">E-post *</label>
                                      <input type="email" value={form.recipientEmail} onChange={(e) => { setForm((f) => ({ ...f, recipientEmail: e.target.value })); setFieldErrors((fe) => ({ ...fe, recipientEmail: '' })); }} onBlur={(e) => { const v = e.target.value.trim(); if (!v) setFieldErrors((fe) => ({ ...fe, recipientEmail: 'Obligatoriskt' })); else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) setFieldErrors((fe) => ({ ...fe, recipientEmail: 'Ogiltig e-postadress' })); }} onFocus={() => setActiveField('E-post')} placeholder="namn@foretag.se" className={`w-full rounded-lg border px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15 transition-all bg-[var(--surface-alt)] ${fieldErrors.recipientEmail ? 'border-red-400' : 'border-[var(--border)] focus:border-[var(--accent)]'}`}/>
                                      {fieldErrors.recipientEmail && <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.recipientEmail}</p>}
                                    </div>
                                  </div>
                                  <div className="relative">
                                    <label className="block text-[10px] font-medium text-[var(--text-secondary)] mb-1">Företag</label>
                                    <input
                                      value={form.recipientCompany}
                                      onChange={(e) => {
                                        setForm((f) => ({ ...f, recipientCompany: e.target.value }));
                                        searchCompanies(e.target.value);
                                      }}
                                      onFocus={() => { setActiveField('Mottagare'); if (form.recipientCompany) searchCompanies(form.recipientCompany); }}
                                      onBlur={() => setTimeout(() => setCompanyResults([]), 150)}
                                      placeholder="Företag"
                                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
                                    />
                                    {(companyResults.length > 0 || companyLoading) && (
                                      <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
                                        {companyLoading ? (
                                          <div className="flex items-center gap-2 px-4 py-3 text-xs text-[var(--text-muted)]">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin shrink-0">
                                              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                            </svg>
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
                                  <div className="flex items-center justify-end pt-2 mt-1 border-t border-[var(--border)]/30">
                                    <button type="button" disabled={!mottagareComplete} onClick={() => { if (mottagareComplete) { setConfirmedSections((s) => { const n = new Set(s); n.add('mottagare'); return n; }); setOpenCards((o) => ({ ...o, mottagare: false })); } }} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150', mottagareComplete ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-emerald-400/60 hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30 cursor-pointer' : 'border-[var(--border)]/40 text-[var(--text-muted)] opacity-35 cursor-not-allowed bg-transparent')}>
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                      Klar
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
  );
}

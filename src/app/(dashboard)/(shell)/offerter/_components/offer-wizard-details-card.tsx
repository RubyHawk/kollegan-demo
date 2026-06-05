'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import type { OfferForm } from '../_store/types';
import { VALIDITY_OPTIONS } from '../_lib/offers-dashboard-constants';
import { CustomFieldsSection } from '@shared/ui/custom-fields-section';
import { useCustomFieldDefinitions } from '@shared/lib/custom-fields/use-custom-field-definitions';

type OfferFormSetter = (form: OfferForm | ((prev: OfferForm) => OfferForm)) => void;
type FieldErrorsSetter = (errors: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
type NullableStringSetter = (value: string | null) => void;
type OpenCards = { mottagare: boolean; detaljer: boolean };
type OpenCardsSetter = (updater: OpenCards | ((prev: OpenCards) => OpenCards)) => void;
type ConfirmedSection = 'mottagare' | 'detaljer';
type ConfirmedSectionsSetter = (
  updater: Set<ConfirmedSection> | ((prev: Set<ConfirmedSection>) => Set<ConfirmedSection>)
) => void;

type OfferWizardDetailsCardProps = {
  form: OfferForm;
  fieldErrors: Record<string, string>;
  openCards: OpenCards;
  confirmedSections: Set<ConfirmedSection>;
  detajerComplete: boolean;
  setForm: OfferFormSetter;
  setFieldErrors: FieldErrorsSetter;
  setOpenCards: OpenCardsSetter;
  setConfirmedSections: ConfirmedSectionsSetter;
  setActiveField: NullableStringSetter;
};

export function OfferWizardDetailsCard({
  form,
  fieldErrors,
  openCards,
  confirmedSections,
  detajerComplete,
  setForm,
  setFieldErrors,
  setOpenCards,
  setConfirmedSections,
  setActiveField,
}: OfferWizardDetailsCardProps) {
  const { definitions: customFieldDefs } = useCustomFieldDefinitions('offer');
  return (
                        <div className={cn('rounded-xl border bg-[var(--surface)] transition-all duration-200', openCards.detaljer ? 'border-[var(--border)] shadow-sm' : 'border-[var(--border)]/60')}>
                          <div onClick={() => setOpenCards((o) => ({ ...o, detaljer: !o.detaljer }))} className="flex items-center gap-3 px-4 pt-3.5 pb-3 cursor-pointer select-none">
                            <div className={cn('w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-300', confirmedSections.has('detaljer') ? 'bg-emerald-500' : 'border-2 border-[var(--accent)]')}>
                              {confirmedSections.has('detaljer') && (
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                            </div>
                            <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Offertdetaljer</span>
                            {!openCards.detaljer && confirmedSections.has('detaljer') && (
                              <span className="text-xs text-[var(--text-muted)] truncate max-w-[100px]">{form.title}</span>
                            )}
                            {confirmedSections.has('detaljer') && !openCards.detaljer ? (
                              <span className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors shrink-0">Redigera</span>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('shrink-0 text-[var(--text-muted)] transition-transform', openCards.detaljer ? 'rotate-180' : '')}>
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            )}
                          </div>
                          <AnimatePresence>
                            {!openCards.detaljer && confirmedSections.has('detaljer') && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden">
                                <div className="px-4 pb-3.5 border-t border-[var(--border)]/30 pt-2.5">
                                  <p className="text-sm text-[var(--text-primary)] font-medium">{form.title}</p>
                                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Giltig {form.validityDays} dagar{form.notes ? ' · Extra kommentar bifogad' : ''}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <AnimatePresence>
                            {openCards.detaljer && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden">
                                <div className="px-4 pt-3 pb-4 space-y-3 border-t border-[var(--border)]/40">
                                  <div>
                                    <label className="block text-[10px] font-medium text-[var(--text-secondary)] mb-1">Rubrik *</label>
                                    <input value={form.title} onChange={(e) => { setForm((f) => ({ ...f, title: e.target.value })); setFieldErrors((fe) => ({ ...fe, title: '' })); }} onBlur={(e) => { const v = e.target.value.trim(); if (!v) setFieldErrors((fe) => ({ ...fe, title: 'Obligatoriskt' })); else if (v.length < 2) setFieldErrors((fe) => ({ ...fe, title: 'Minst 2 tecken' })); }} onFocus={() => setActiveField('Rubrik')} placeholder="t.ex. Hotellprojekt Q2 2026" className={`w-full rounded-lg border px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/15 transition-all bg-[var(--surface-alt)] ${fieldErrors.title ? 'border-red-400' : 'border-[var(--border)] focus:border-[var(--accent)]'}`}/>
                                    {fieldErrors.title && <p className="text-[10px] text-red-500 mt-0.5">{fieldErrors.title}</p>}
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-medium text-[var(--text-secondary)] mb-1.5">Giltighetstid</label>
                                    <div className="flex rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-0.5 gap-0.5">
                                      {VALIDITY_OPTIONS.map(({ days, label }) => (
                                        <button key={days} type="button" onClick={() => setForm((f) => ({ ...f, validityDays: days }))} className={`flex-1 rounded-md px-1 py-1.5 text-[10px] font-medium transition-all ${form.validityDays === days ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                                          {label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <details className="rounded-lg border border-[var(--border)]/60 overflow-hidden group">
                                    <summary className="px-3 py-2 text-[10px] font-medium text-[var(--text-secondary)] cursor-pointer bg-[var(--surface-alt)] list-none flex items-center justify-between hover:bg-[var(--surface-active)] transition-colors select-none">
                                      <span>Extra kommentar till denna offert{form.notes ? ' · ifyllt' : ' (frivilligt)'}</span>
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180">
                                        <polyline points="6 9 12 15 18 9"/>
                                      </svg>
                                    </summary>
                                    <div className="p-3 border-t border-[var(--border)]">
                                      <p className="mb-2 text-[10px] leading-4 text-[var(--text-muted)]">
                                        Mallens juridik och standardvillkor styr du på offertsidan i mallen. Här lägger du bara till en extra kommentar för just den här offerten.
                                      </p>
                                      <textarea value={form.notes} rows={3} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="T.ex. särskild leveransinfo, projektkommentar eller kompletterande notering…" className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all resize-none"/>
                                    </div>
                                  </details>
                                  <CustomFieldsSection
                                    definitions={customFieldDefs}
                                    values={form.customFields}
                                    onChange={(customFields) => setForm((f) => ({ ...f, customFields }))}
                                  />
                                  <div className="flex items-center justify-end pt-2 mt-1 border-t border-[var(--border)]/30">
                                    <button type="button" disabled={!detajerComplete} onClick={() => { if (detajerComplete) { setConfirmedSections((s) => { const n = new Set(s); n.add('detaljer'); return n; }); setOpenCards((o) => ({ ...o, detaljer: false })); } }} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150', detajerComplete ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-emerald-400/60 hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30 cursor-pointer' : 'border-[var(--border)]/40 text-[var(--text-muted)] opacity-35 cursor-not-allowed bg-transparent')}>
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

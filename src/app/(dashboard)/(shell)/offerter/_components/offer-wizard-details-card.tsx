'use client';

import { Check, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import { VALIDITY_OPTIONS } from '../_lib/offers-dashboard-constants';
import type { OfferForm } from '../_store/types';

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
  const detailsConfirmed = confirmedSections.has('detaljer');

  return (
    <div className={cn(
      'rounded-[var(--ui-radius-lg)] border bg-[var(--ui-surface)] transition-colors',
      openCards.detaljer ? 'border-[var(--ui-border)]' : 'border-[var(--ui-border-subtle)]',
    )}>
      <button
        type="button"
        onClick={() => setOpenCards((o) => ({ ...o, detaljer: !o.detaljer }))}
        className="flex w-full items-center gap-3 px-4 pb-3 pt-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
      >
        <span className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-full transition-colors',
          detailsConfirmed
            ? 'bg-[var(--ui-success-text)] text-[var(--ui-text-inverse)]'
            : 'border-2 border-[var(--ui-accent)]',
        )}>
          {detailsConfirmed ? <Check size={10} strokeWidth={2.5} aria-hidden /> : null}
        </span>
        <span className="flex-1 text-xs font-semibold uppercase text-[var(--ui-text-secondary)]">Offertdetaljer</span>
        {!openCards.detaljer && detailsConfirmed ? (
          <span className="max-w-[100px] truncate text-xs text-[var(--ui-text-muted)]">{form.title}</span>
        ) : null}
        {detailsConfirmed && !openCards.detaljer ? (
          <span className="shrink-0 text-[10px] text-[var(--ui-accent)]">Redigera</span>
        ) : (
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            className={cn('shrink-0 text-[var(--ui-text-muted)] transition-transform', openCards.detaljer ? 'rotate-180' : '')}
            aria-hidden
          />
        )}
      </button>

      <AnimatePresence>
        {!openCards.detaljer && detailsConfirmed ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--ui-border)] px-4 pb-3.5 pt-2.5">
              <p className="text-sm font-medium text-[var(--ui-text)]">{form.title}</p>
              <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                Giltig {form.validityDays} dagar{form.notes ? ' · Extra kommentar bifogad' : ''}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {openCards.detaljer ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-[var(--ui-border)] px-4 pb-4 pt-3">
              <div>
                <label className="mb-1 block text-[10px] font-medium text-[var(--ui-text-secondary)]">Rubrik *</label>
                <Input
                  value={form.title}
                  onChange={(event) => {
                    setForm((f) => ({ ...f, title: event.target.value }));
                    setFieldErrors((fe) => ({ ...fe, title: '' }));
                  }}
                  onBlur={(event) => {
                    const value = event.target.value.trim();
                    if (!value) setFieldErrors((fe) => ({ ...fe, title: 'Obligatoriskt' }));
                    else if (value.length < 2) setFieldErrors((fe) => ({ ...fe, title: 'Minst 2 tecken' }));
                  }}
                  onFocus={() => setActiveField('Rubrik')}
                  placeholder="t.ex. Hotellprojekt Q2 2026"
                  aria-invalid={fieldErrors.title ? true : undefined}
                  className={cn('h-9 text-xs', fieldErrors.title && 'border-[var(--ui-danger-border)]')}
                />
                {fieldErrors.title ? <p className="mt-0.5 text-[10px] text-[var(--ui-danger-text)]">{fieldErrors.title}</p> : null}
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-medium text-[var(--ui-text-secondary)]">Giltighetstid</label>
                <div className="flex gap-0.5 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-0.5">
                  {VALIDITY_OPTIONS.map(({ days, label }) => {
                    const selected = form.validityDays === days;
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, validityDays: days }))}
                        className={cn(
                          'flex-1 rounded-[var(--ui-radius-sm)] px-1 py-1.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]',
                          selected
                            ? 'border border-[var(--ui-accent-border)] bg-[var(--ui-surface)] text-[var(--ui-text)]'
                            : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text-secondary)]',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <details className="group overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--ui-border)]">
                <summary className="flex cursor-pointer select-none items-center justify-between bg-[var(--ui-surface-subtle)] px-3 py-2 text-[10px] font-medium text-[var(--ui-text-secondary)] transition-colors hover:bg-[var(--ui-surface-hover)]">
                  <span>Extra kommentar till denna offert{form.notes ? ' · ifyllt' : ' (frivilligt)'}</span>
                  <ChevronDown size={14} strokeWidth={1.75} className="transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="border-t border-[var(--ui-border)] p-3">
                  <p className="mb-2 text-[10px] leading-4 text-[var(--ui-text-muted)]">
                    Mallens juridik och standardvillkor styr du på offertsidan i mallen. Här lägger du bara till en extra kommentar för just den här offerten.
                  </p>
                  <Textarea
                    value={form.notes}
                    rows={3}
                    onChange={(event) => setForm((f) => ({ ...f, notes: event.target.value }))}
                    placeholder="T.ex. särskild leveransinfo, projektkommentar eller kompletterande notering..."
                    className="min-h-20 resize-none text-xs"
                  />
                </div>
              </details>

              <div className="mt-1 flex items-center justify-end border-t border-[var(--ui-border)] pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!detajerComplete}
                  onClick={() => {
                    if (detajerComplete) {
                      setConfirmedSections((sections) => {
                        const next = new Set(sections);
                        next.add('detaljer');
                        return next;
                      });
                      setOpenCards((cards) => ({ ...cards, detaljer: false }));
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

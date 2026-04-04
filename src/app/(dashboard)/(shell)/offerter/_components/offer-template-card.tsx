'use client';

import { cn } from '@shared/lib/utils';
import type { OfferTemplate } from '../_store/types';

type OfferTemplateCardProps = {
  template: OfferTemplate;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
};

export function OfferTemplateCard({
  template,
  selected,
  onSelect,
  onPreview,
}: OfferTemplateCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'group w-full text-left rounded-2xl border p-3.5 transition-all duration-200',
        selected
          ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-[0_16px_40px_rgba(0,0,0,0.08)]'
          : 'border-[var(--border)] bg-[var(--surface-alt)] hover:border-[var(--accent)]/40 hover:bg-[var(--surface)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]',
        'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-xl border border-[var(--border)]/60 bg-[var(--surface)]/70" />
          <div
            className={cn(
              'relative h-24 w-[76px] overflow-hidden rounded-xl border p-2 transition-colors',
              selected
                ? 'border-[var(--accent)]/30 bg-white'
                : 'border-[var(--border)] bg-white',
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]/70" />
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]/35" />
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]/20" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-7 rounded-lg bg-[var(--accent)]/12" />
              <div className="h-2 rounded-full bg-slate-200" />
              <div className="h-2 w-4/5 rounded-full bg-slate-200/80" />
              <div className="grid grid-cols-2 gap-1 pt-1">
                <div className="h-4 rounded-md bg-slate-100" />
                <div className="h-4 rounded-md bg-[var(--accent)]/10" />
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Mall
                </span>
                {selected && (
                  <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                    Vald
                  </span>
                )}
              </div>
              <p
                className={cn(
                  'truncate text-sm font-semibold transition-colors',
                  selected
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-primary)] group-hover:text-[var(--accent)]',
                )}
              >
                {template.name}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                Välj den här mallen för offertens struktur och öppna en snabb
                förhandsvisning innan du går vidare.
              </p>
            </div>

            {selected && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-[var(--accent)]"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
              Dokumentpreview
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onPreview();
              }}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/8"
            >
              Förhandsvisa
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

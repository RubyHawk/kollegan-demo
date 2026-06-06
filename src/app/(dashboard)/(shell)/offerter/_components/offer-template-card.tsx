'use client';

import { Check, Eye } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { StatusBadge } from '@shared/ui/status-badge';
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
        'group w-full rounded-[var(--ui-radius-lg)] border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2',
        selected
          ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)]'
          : 'border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] hover:border-[var(--ui-accent-border)] hover:bg-[var(--ui-surface-hover)]',
      )}
    >
      <span className="flex items-start gap-3">
        <span className="relative shrink-0">
          <span className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border-subtle)] bg-[var(--ui-surface)]" />
          <span
            className={cn(
              'relative block h-24 w-[76px] overflow-hidden rounded-[var(--ui-radius-lg)] border bg-[var(--ui-surface-raised)] p-2 transition-colors',
              selected ? 'border-[var(--ui-accent-border)]' : 'border-[var(--ui-border)]',
            )}
          >
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ui-accent)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ui-accent-border)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ui-border-strong)]" />
            </span>
            <span className="mt-3 block space-y-2">
              <span className="block h-7 rounded-[var(--ui-radius-md)] bg-[var(--ui-accent-subtle)]" />
              <span className="block h-2 rounded-full bg-[var(--ui-border)]" />
              <span className="block h-2 w-4/5 rounded-full bg-[var(--ui-border-subtle)]" />
              <span className="grid grid-cols-2 gap-1 pt-1">
                <span className="h-4 rounded-[var(--ui-radius-sm)] bg-[var(--ui-surface-subtle)]" />
                <span className="h-4 rounded-[var(--ui-radius-sm)] bg-[var(--ui-accent-subtle)]" />
              </span>
            </span>
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="mb-1 flex items-center gap-2">
                <StatusBadge tone="neutral" className="text-[10px] uppercase">Mall</StatusBadge>
                {selected ? <StatusBadge tone="accent" className="text-[10px] uppercase">Vald</StatusBadge> : null}
              </span>
              <span
                className={cn(
                  'block truncate text-sm font-semibold transition-colors',
                  selected ? 'text-[var(--ui-accent)]' : 'text-[var(--ui-text)] group-hover:text-[var(--ui-accent)]',
                )}
              >
                {template.name}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-[var(--ui-text-muted)]">
                Välj den här mallen för offertens struktur och öppna en snabb förhandsvisning innan du går vidare.
              </span>
            </span>

            {selected ? <Check size={16} strokeWidth={2} className="shrink-0 text-[var(--ui-accent)]" aria-hidden /> : null}
          </span>

          <span className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--ui-text-secondary)]">
              Dokumentpreview
            </span>
            <Button
              type="button"
              variant="link"
              size="compact"
              onClick={(event) => {
                event.stopPropagation();
                onPreview();
              }}
              className="h-auto gap-1 px-0 py-0 text-[11px]"
            >
              Förhandsvisa
              <Eye size={14} strokeWidth={1.75} aria-hidden />
            </Button>
          </span>
        </span>
      </span>
    </div>
  );
}

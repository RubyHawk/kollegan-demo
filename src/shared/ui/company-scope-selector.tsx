'use client';

import { Building2, CheckCircle } from 'lucide-react';
import type { ActiveCompanyOption } from '@shared/hooks/use-active-company';

interface CompanyScopeSelectorProps {
  companies: ActiveCompanyOption[];
  selectedCompanyId: string;
  onSelect: (companyId: string) => void;
  title?: string;
  description?: string;
  compact?: boolean;
}

export function CompanyScopeSelector({
  companies,
  selectedCompanyId,
  onSelect,
  title = 'Aktivt företag',
  description = 'Det här styr vilka mallar, produkter och branding-inställningar som visas.',
  compact = false,
}: CompanyScopeSelectorProps) {
  if (companies.length === 0) {
    return null;
  }

  return (
    <section className={`rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-accent)]">
          <Building2 size={18} strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--ui-text)]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--ui-text-muted)]">{description}</p>
        </div>
      </div>

      <div className={`mt-4 grid gap-2 ${compact ? 'sm:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
        {companies.map((company) => {
          const active = company.id === selectedCompanyId;
          return (
            <button
              key={company.id}
              type="button"
              onClick={() => onSelect(company.id)}
              className={`rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] ${
                active
                  ? 'border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)]'
                  : 'border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] hover:border-[var(--ui-accent-border)] hover:bg-[var(--ui-surface)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--ui-text)]">{company.name}</p>
                  {company.orgNumber && (
                    <p className="mt-1 truncate text-xs text-[var(--ui-text-muted)]">{company.orgNumber}</p>
                  )}
                </div>
                {active && <CheckCircle size={18} strokeWidth={1.75} className="shrink-0 text-[var(--ui-accent)]" />}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

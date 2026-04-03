'use client';

import { Buildings, CheckCircle } from '@phosphor-icons/react';
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
    <section className={`rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)] ${compact ? 'p-4' : 'p-5'} shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
          <Buildings size={18} weight="duotone" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{description}</p>
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
              className={`rounded-[22px] border px-4 py-3 text-left transition-all ${
                active
                  ? 'border-[var(--accent)] bg-[var(--accent)]/8 shadow-sm'
                  : 'border-[var(--border)] bg-[var(--surface-alt)] hover:border-[var(--accent)]/40 hover:bg-[var(--surface)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{company.name}</p>
                  {company.orgNumber && (
                    <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{company.orgNumber}</p>
                  )}
                </div>
                {active && <CheckCircle size={18} weight="fill" className="shrink-0 text-[var(--accent)]" />}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

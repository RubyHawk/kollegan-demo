'use client';

import { ArrowSquareOut, PencilSimple, Trash, UsersThree } from '@phosphor-icons/react';
import type { Company } from '@modules/supporting/offers';

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function companyAddress(company: Company) {
  return [company.addressLine1, company.addressLine2, [company.postalCode, company.city].filter(Boolean).join(' '), company.region, company.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' • ');
}

interface CompanyRowProps {
  company: Company;
  active: boolean;
  onActivate: (companyId: string) => void;
  onOverview: (company: Company) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onMembers: (company: Company) => void;
}

export function CompanyRow({
  company,
  active,
  onActivate,
  onOverview,
  onEdit,
  onDelete,
  onMembers,
}: CompanyRowProps) {
  return (
    <div className="border-b border-[var(--border)] last:border-b-0">
      <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logoUrl}
              alt={company.name}
              className="h-12 w-12 shrink-0 rounded-2xl border border-[var(--border)] object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-sm font-semibold text-[var(--text-muted)]">
              {initials(company.name)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{company.name}</span>
              {active && (
                <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                  Aktivt företag
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
              {companyAddress(company) && <span>{companyAddress(company)}</span>}
              {company.website && <span>{company.website.replace(/^https?:\/\//, '')}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <button
            type="button"
            onClick={() => onActivate(company.id)}
            className={`rounded-2xl border px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'border-[var(--accent)]/35 bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]'
            }`}
          >
            {active ? 'Valt nu' : 'Välj företag'}
          </button>
          <button
            type="button"
            onClick={() => onOverview(company)}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-alt)]"
          >
            <ArrowSquareOut size={16} weight="duotone" />
            Översikt
          </button>
          <button
            type="button"
            onClick={() => onMembers(company)}
            className="rounded-xl p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]"
            title="Hantera medlemmar"
          >
            <UsersThree size={18} weight="duotone" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(company)}
            className="rounded-xl p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]"
            title="Redigera företag"
          >
            <PencilSimple size={18} weight="duotone" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(company)}
            className="rounded-xl p-2 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            title="Ta bort företag"
          >
            <Trash size={18} weight="duotone" />
          </button>
        </div>
      </div>
    </div>
  );
}

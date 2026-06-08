'use client';

import { ExternalLink, Mail, Pencil, Trash2, Users } from 'lucide-react';
import type { Company } from '@shared/lib/api/companies.api';
import { Button } from '@shared/ui/button';
import { StatusBadge } from '@shared/ui/status-badge';

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
    .join(' · ');
}

interface CompanyRowProps {
  company: Company;
  active: boolean;
  onActivate: (companyId: string) => void;
  onOverview: (company: Company) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onMembers: (company: Company) => void;
  onLeadIntake: (company: Company) => void;
}

export function CompanyRow({
  company,
  active,
  onActivate,
  onOverview,
  onEdit,
  onDelete,
  onMembers,
  onLeadIntake,
}: CompanyRowProps) {
  const address = companyAddress(company);

  return (
    <div className="border-b border-[var(--ui-border)] last:border-b-0">
      <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logoUrl}
              alt={company.name}
              className="h-12 w-12 shrink-0 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-sm font-semibold text-[var(--ui-text-muted)]">
              {initials(company.name)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-[var(--ui-text)]">{company.name}</span>
              {active ? <StatusBadge tone="accent">Aktivt företag</StatusBadge> : null}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ui-text-muted)]">
              {address ? <span>{address}</span> : null}
              {company.website ? <span>{company.website.replace(/^https?:\/\//, '')}</span> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Button type="button" variant={active ? 'default' : 'secondary'} size="compact" onClick={() => onActivate(company.id)}>
            {active ? 'Valt nu' : 'Välj företag'}
          </Button>
          <Button type="button" variant="secondary" size="compact" onClick={() => onOverview(company)}>
            <ExternalLink size={16} strokeWidth={1.75} />
            Översikt
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => onMembers(company)} aria-label="Hantera medlemmar">
            <Users size={18} strokeWidth={1.75} />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => onLeadIntake(company)} aria-label="Intresseanmälan">
            <Mail size={18} strokeWidth={1.75} />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(company)} aria-label="Redigera företag">
            <Pencil size={18} strokeWidth={1.75} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(company)}
            className="text-[var(--ui-danger-text)] hover:text-[var(--ui-danger-text)]"
            aria-label="Ta bort företag"
          >
            <Trash2 size={18} strokeWidth={1.75} />
          </Button>
        </div>
      </div>
    </div>
  );
}

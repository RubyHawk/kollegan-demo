'use client';

import { Folders, Plus } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { CompanyScopeSelector } from '@shared/ui/company-scope-selector';
import type { ActiveCompanyOption } from '@shared/hooks/use-active-company';

interface ProductLibraryHeaderProps {
  companies: ActiveCompanyOption[];
  selectedCompanyId: string;
  companyLoading: boolean;
  companyError: string | null;
  productCount: number;
  activeCount: number;
  totalVisible: number;
  onSelectCompany: (companyId: string) => void;
  onCreateProduct: () => void;
  onManageCategories: () => void;
}

export function ProductLibraryHeader({
  companies,
  selectedCompanyId,
  companyLoading,
  companyError,
  productCount,
  activeCount,
  totalVisible,
  onSelectCompany,
  onCreateProduct,
  onManageCategories,
}: ProductLibraryHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[var(--ui-radius-panel)] border border-[var(--ui-border)] bg-[var(--ui-surface-raised)] shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-3 px-5 py-5 sm:px-6">
          <div className="inline-flex rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-muted)]">
            Produktbibliotek
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--ui-text)]">
            Håll biblioteket snabbt, tydligt och lätt att lita på.
          </h1>

          <div className="grid max-w-sm grid-cols-3 gap-2">
            <ProductStat label="Produkter" value={productCount} />
            <ProductStat label="Aktiva nu" value={activeCount} />
            <ProductStat label="Visas nu" value={totalVisible} />
          </div>

          {companies.length > 1 && (
            <CompanyScopeSelector
              companies={companies}
              selectedCompanyId={selectedCompanyId}
              onSelect={onSelectCompany}
              compact
              title="Företagets bibliotek"
              description="Byt företag för att se rätt produkter och kategorier."
            />
          )}
          {companyLoading && (
            <p className="text-xs text-[var(--ui-text-muted)]">Läser in företagets bibliotek...</p>
          )}
          {companyError && (
            <p className="text-xs text-[var(--ui-warning-text)]">{companyError}</p>
          )}
        </div>

        <aside className="flex flex-col justify-center gap-2 border-t border-[var(--ui-border)] px-5 py-5 lg:border-l lg:border-t-0">
          <Button type="button" onClick={onCreateProduct} className="h-10 rounded-[var(--ui-radius-control)] px-3.5">
            <Plus aria-hidden="true" size={16} strokeWidth={2} />
            Ny produkt
          </Button>
          <Button type="button" variant="outline" onClick={onManageCategories} className="h-10 rounded-[var(--ui-radius-control)] px-3.5">
            <Folders aria-hidden="true" size={16} strokeWidth={2} />
            Hantera kategorier
          </Button>
        </aside>
      </div>
    </section>
  );
}

function ProductStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--ui-radius-panel)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-muted)]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[var(--ui-text)]">{value}</div>
    </div>
  );
}

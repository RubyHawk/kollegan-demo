'use client';

import { Folders, Plus } from '@phosphor-icons/react';
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
    <section className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface-0)] shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-3 px-5 py-5 sm:px-6">
          <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Produktbibliotek
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
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
            <p className="text-xs text-[var(--text-muted)]">Läser in företagets bibliotek...</p>
          )}
          {companyError && (
            <p className="text-xs text-[var(--status-warning-text)]">{companyError}</p>
          )}
        </div>

        <aside className="flex flex-col justify-center gap-2 border-t border-[var(--border)] px-5 py-5 lg:border-l lg:border-t-0">
          <Button type="button" onClick={onCreateProduct} className="h-10 rounded-xl px-3.5">
            <Plus size={16} weight="bold" />
            Ny produkt
          </Button>
          <Button type="button" variant="outline" onClick={onManageCategories} className="h-10 rounded-xl px-3.5">
            <Folders size={16} weight="bold" />
            Hantera kategorier
          </Button>
        </aside>
      </div>
    </section>
  );
}

function ProductStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

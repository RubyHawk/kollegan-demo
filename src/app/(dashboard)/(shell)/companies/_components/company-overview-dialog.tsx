'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowSquareOut,
  Buildings,
  FileText,
  Globe,
  NotePencil,
  Package,
  Users,
} from '@phosphor-icons/react';
import type { Company } from '@modules/supporting/offers';
import { fetchWithRefresh } from '@shared/lib/api-client';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';

interface CompanyOverviewDialogProps {
  open: boolean;
  company: Company | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (company: Company) => void;
  onManageMembers: (company: Company) => void;
  onOpenTemplates: (company: Company) => void;
  onOpenProducts: (company: Company) => void;
}

interface MemberSummary {
  id: string;
  role: 'staff' | 'admin';
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface TemplateSummary {
  id: string;
  name: string;
  companyId?: string;
}

interface ProductSummary {
  id: string;
  name: string;
  category?: string;
  companyId?: string;
}

interface OverviewState {
  loading: boolean;
  error: string | null;
  members: MemberSummary[];
  templates: TemplateSummary[];
  products: ProductSummary[];
}

const EMPTY_STATE: OverviewState = {
  loading: true,
  error: null,
  members: [],
  templates: [],
  products: [],
};

function getDisplayName(user: MemberSummary['user']) {
  const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return full || user.email;
}

function getCompanyAddress(company: Company) {
  return [
    company.addressLine1,
    company.addressLine2,
    [company.postalCode, company.city].filter(Boolean).join(' '),
    company.region,
    company.country,
  ]
    .map((part) => part?.trim())
    .filter(Boolean);
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--surface-alt)] ${className ?? ''}`} />;
}

export function CompanyOverviewDialog({
  open,
  company,
  onOpenChange,
  onEdit,
  onManageMembers,
  onOpenTemplates,
  onOpenProducts,
}: CompanyOverviewDialogProps) {
  const [state, setState] = useState<OverviewState>(EMPTY_STATE);

  useEffect(() => {
    if (!open || !company) return;

    let cancelled = false;
    setState(EMPTY_STATE);

    void (async () => {
      try {
        const [membersRes, templatesRes, productsRes] = await Promise.all([
          fetchWithRefresh(`/api/companies/${company.id}/members`),
          fetchWithRefresh(`/api/templates?companyId=${company.id}`),
          fetchWithRefresh(`/api/offers/products?companyId=${company.id}`),
        ]);

        if (!membersRes.ok) throw new Error(`Kunde inte hämta användare (${membersRes.status})`);
        if (!templatesRes.ok) throw new Error(`Kunde inte hämta mallar (${templatesRes.status})`);
        if (!productsRes.ok) throw new Error(`Kunde inte hämta produkter (${productsRes.status})`);

        const membersJson = (await membersRes.json()) as { data: { members: MemberSummary[] } };
        const templatesJson = (await templatesRes.json()) as { data?: TemplateSummary[] };
        const productsJson = (await productsRes.json()) as { data?: { products?: ProductSummary[] } };

        if (cancelled) return;

        setState({
          loading: false,
          error: null,
          members: membersJson.data.members,
          templates: templatesJson.data ?? [],
          products: productsJson.data?.products ?? [],
        });
      } catch (error) {
        if (cancelled) return;
        setState({ loading: false, error: (error as Error).message, members: [], templates: [], products: [] });
      }
    })();

    return () => { cancelled = true; };
  }, [company, open]);

  const brandingReady = useMemo(() => {
    if (!company) return false;
    return Boolean(company.logoUrl || company.website || getCompanyAddress(company).length > 0);
  }, [company]);

  if (!company) return null;

  const addressLines = getCompanyAddress(company);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileVariant="right-panel" showMobileClose>
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <DialogHeader className="shrink-0 border-b border-[var(--border)] px-5 py-4 pr-12">
            <div className="flex items-start gap-3">
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-10 w-10 shrink-0 rounded-xl border border-[var(--border)] object-cover"
                />
              ) : (
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                  <Buildings size={18} weight="duotone" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-base">{company.name}</DialogTitle>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      brandingReady
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                        : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
                    }`}
                  >
                    {brandingReady ? 'Branding redo' : 'Branding saknas'}
                  </span>
                  {company.orgNumber && (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                      {company.orgNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="min-h-0 flex-1 overflow-y-auto">

            {/* Company identity section */}
            <section className="border-b border-[var(--border)] px-5 py-4">
              {addressLines.length > 0 && (
                <div className="mb-3 space-y-0.5 text-sm leading-6 text-[var(--text-secondary)]">
                  {addressLines.map((line) => <p key={line}>{line}</p>)}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {company.website && (
                  <Link
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline"
                  >
                    <Globe size={14} />
                    {company.website.replace(/^https?:\/\//, '')}
                    <ArrowSquareOut size={12} />
                  </Link>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => onEdit(company)}
              >
                <NotePencil size={14} weight="duotone" />
                Redigera företag
              </Button>
            </section>

            {/* Members section */}
            <section className="border-b border-[var(--border)] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users size={15} weight="duotone" className="text-[var(--accent)]" />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Användare</p>
                  {!state.loading && (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-1.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                      {state.members.length}
                    </span>
                  )}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => onManageMembers(company)}>
                  Hantera
                </Button>
              </div>

              <div className="mt-3 space-y-1.5">
                {state.loading ? (
                  <>
                    <Skeleton className="h-9" />
                    <Skeleton className="h-9" />
                    <Skeleton className="h-9 w-3/4" />
                  </>
                ) : state.members.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">Inga kopplade användare.</p>
                ) : (
                  state.members.slice(0, 5).map((member) => {
                    const isAdmin = member.role === 'admin';
                    return (
                      <div key={member.id} className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{getDisplayName(member.user)}</p>
                          <p className="truncate text-xs text-[var(--text-muted)]">{member.user.email}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isAdmin
                              ? 'bg-[var(--accent)]/10 text-[var(--accent)] ring-1 ring-inset ring-[var(--accent)]/20'
                              : 'border border-[var(--border)] text-[var(--text-muted)]'
                          }`}
                        >
                          {isAdmin ? 'Admin' : 'Staff'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Templates section */}
            <section className="border-b border-[var(--border)] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText size={15} weight="duotone" className="text-[var(--accent)]" />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Mallar</p>
                  {!state.loading && (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-1.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                      {state.templates.length}
                    </span>
                  )}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => onOpenTemplates(company)}>
                  Öppna mallar
                </Button>
              </div>

              <div className="mt-3 space-y-1.5">
                {state.loading ? (
                  <>
                    <Skeleton className="h-9" />
                    <Skeleton className="h-9 w-4/5" />
                  </>
                ) : state.templates.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">Inga företagsspecifika mallar.</p>
                ) : (
                  state.templates.slice(0, 5).map((template) => (
                    <div key={template.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{template.name}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Products section */}
            <section className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Package size={15} weight="duotone" className="text-[var(--accent)]" />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Produkter</p>
                  {!state.loading && (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-1.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                      {state.products.length}
                    </span>
                  )}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => onOpenProducts(company)}>
                  Öppna bibliotek
                </Button>
              </div>

              <div className="mt-3 space-y-1.5">
                {state.loading ? (
                  <>
                    <Skeleton className="h-9" />
                    <Skeleton className="h-9" />
                    <Skeleton className="h-9 w-2/3" />
                  </>
                ) : state.products.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">Inga produkter kopplade.</p>
                ) : (
                  state.products.slice(0, 5).map((product) => (
                    <div key={product.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{product.name}</p>
                      {product.category && <p className="truncate text-xs text-[var(--text-muted)]">{product.category}</p>}
                    </div>
                  ))
                )}
              </div>

              {state.error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
                  {state.error}
                </div>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-[var(--border)] px-5 py-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full">
                Stäng
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

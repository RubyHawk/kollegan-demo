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
} from '@phosphor-icons/react';
import { fetchWithRefresh } from '@shared/lib/api-client';
import { listCompanyMembers, type Company } from '@shared/lib/api/companies.api';
import { listProducts } from '@shared/lib/api/products.api';
import { Button } from '@shared/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ModalBody,
  ModalMetaCard,
  ModalSection,
} from '@shared/ui/dialog';

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
    firstName?: string | null;
    lastName?: string | null;
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

function SummaryList({
  title,
  count,
  loading,
  empty,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  count: number;
  loading: boolean;
  empty: string;
  actionLabel: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <ModalSection tone="subtle" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
          {!loading ? (
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
              {count}
            </span>
          ) : null}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-12 animate-pulse rounded-xl bg-[var(--surface)]" />
          <div className="h-12 animate-pulse rounded-xl bg-[var(--surface)]" />
        </div>
      ) : count === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">{empty}</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </ModalSection>
  );
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
        const [membersPayload, templatesRes, productsPayload] = await Promise.all([
          listCompanyMembers(company.id),
          fetchWithRefresh(`/api/templates?companyId=${company.id}`),
          listProducts({ companyId: company.id }),
        ]);

        if (!templatesRes.ok) throw new Error(`Kunde inte hämta mallar (${templatesRes.status})`);

        const templatesJson = (await templatesRes.json()) as { data?: TemplateSummary[] };

        if (cancelled) return;

        setState({
          loading: false,
          error: null,
          members: membersPayload.members,
          templates: templatesJson.data ?? [],
          products: productsPayload,
        });
      } catch (error) {
        if (cancelled) return;
        setState({
          loading: false,
          error: (error as Error).message,
          members: [],
          templates: [],
          products: [],
        });
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
      <DialogContent mobileVariant="right-panel" size="right-panel" showMobileClose>
        <div className="flex h-full flex-col overflow-hidden">
          <DialogHeader className="border-b border-[var(--border)] pr-12">
            <div className="flex items-start gap-3">
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-11 w-11 shrink-0 rounded-xl border border-[var(--border)] object-cover"
                />
              ) : (
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                  <Buildings size={18} weight="duotone" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate">{company.name}</DialogTitle>
                <DialogDescription className="mt-1">
                  Snabb överblick över företagets profil, användare, mallar och produkter.
                </DialogDescription>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={
                      brandingReady
                        ? 'rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                        : 'rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
                    }
                  >
                    {brandingReady ? 'Branding redo' : 'Branding saknas'}
                  </span>
                  {company.orgNumber ? (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
                      {company.orgNumber}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </DialogHeader>

          <ModalBody className="space-y-4">
            <ModalMetaCard>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      Företagsprofil
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">Adress, webbplats och snabba genvägar.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => onEdit(company)}>
                    <NotePencil size={14} weight="duotone" />
                    Redigera
                  </Button>
                </div>

                {addressLines.length > 0 ? (
                  <div className="space-y-1 text-sm leading-6 text-[var(--text-secondary)]">
                    {addressLines.map((line) => <p key={line}>{line}</p>)}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">Ingen adress tillagd ännu.</p>
                )}

                {company.website ? (
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
                ) : null}
              </div>
            </ModalMetaCard>

            <SummaryList
              title="Användare"
              count={state.members.length}
              loading={state.loading}
              empty="Inga kopplade användare."
              actionLabel="Hantera"
              onAction={() => onManageMembers(company)}
            >
              {state.members.slice(0, 4).map((member) => {
                const isAdmin = member.role === 'admin';
                return (
                  <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface)] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{getDisplayName(member.user)}</p>
                      <p className="truncate text-xs text-[var(--text-muted)]">{member.user.email}</p>
                    </div>
                    <span
                      className={
                        isAdmin
                          ? 'rounded-full bg-[var(--accent)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--accent)] ring-1 ring-inset ring-[var(--accent)]/20'
                          : 'rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]'
                      }
                    >
                      {isAdmin ? 'Admin' : 'Staff'}
                    </span>
                  </div>
                );
              })}
            </SummaryList>

            <SummaryList
              title="Mallar"
              count={state.templates.length}
              loading={state.loading}
              empty="Inga företagsspecifika mallar."
              actionLabel="Öppna"
              onAction={() => onOpenTemplates(company)}
            >
              {state.templates.slice(0, 4).map((template) => (
                <div key={template.id} className="rounded-xl bg-[var(--surface)] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <FileText size={14} weight="duotone" className="text-[var(--accent)]" />
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{template.name}</p>
                  </div>
                </div>
              ))}
            </SummaryList>

            <SummaryList
              title="Produkter"
              count={state.products.length}
              loading={state.loading}
              empty="Inga produkter kopplade."
              actionLabel="Öppna"
              onAction={() => onOpenProducts(company)}
            >
              {state.products.slice(0, 4).map((product) => (
                <div key={product.id} className="rounded-xl bg-[var(--surface)] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Package size={14} weight="duotone" className="text-[var(--accent)]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{product.name}</p>
                      {product.category ? (
                        <p className="truncate text-xs text-[var(--text-muted)]">{product.category}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </SummaryList>

            {state.error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
                {state.error}
              </div>
            ) : null}
          </ModalBody>

          <div className="shrink-0 border-t border-[var(--border)] px-4 py-3 sm:px-6">
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

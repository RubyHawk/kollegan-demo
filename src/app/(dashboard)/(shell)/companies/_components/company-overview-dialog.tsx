'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Building2, ExternalLink, FileText, Globe, Package, Pencil } from 'lucide-react';
import { listCompanyMembers, type Company } from '@shared/lib/api/companies.api';
import { listProducts } from '@shared/lib/api/products.api';
import { listTemplates } from '@shared/lib/api/templates.api';
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
import { InlineAlert } from '@shared/ui/inline-alert';
import { StatusBadge } from '@shared/ui/status-badge';

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
  children: ReactNode;
}) {
  return (
    <ModalSection tone="subtle" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[var(--ui-text)]">{title}</p>
          {!loading ? <StatusBadge tone="neutral">{count}</StatusBadge> : null}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-12 animate-pulse rounded-[var(--ui-radius-lg)] bg-[var(--ui-surface)]" />
          <div className="h-12 animate-pulse rounded-[var(--ui-radius-lg)] bg-[var(--ui-surface)]" />
        </div>
      ) : count === 0 ? (
        <p className="text-sm text-[var(--ui-text-muted)]">{empty}</p>
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

    void (async () => {
      try {
        await Promise.resolve();
        if (cancelled) return;
        setState(EMPTY_STATE);

        const [membersPayload, templatesRes, productsPayload] = await Promise.all([
          listCompanyMembers(company.id),
          listTemplates({ companyId: company.id }),
          listProducts({ companyId: company.id }),
        ]);

        if (cancelled) return;

        setState({
          loading: false,
          error: null,
          members: membersPayload.members,
          templates: templatesRes,
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

    return () => {
      cancelled = true;
    };
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
          <DialogHeader className="border-b border-[var(--ui-border)] pr-12">
            <div className="flex items-start gap-3">
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-11 w-11 shrink-0 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] object-cover"
                />
              ) : (
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-accent)]">
                  <Building2 size={18} strokeWidth={1.75} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate">{company.name}</DialogTitle>
                <DialogDescription className="mt-1">
                  Snabb överblick över företagets profil, användare, mallar och produkter.
                </DialogDescription>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge tone={brandingReady ? 'success' : 'warning'}>
                    {brandingReady ? 'Branding redo' : 'Branding saknas'}
                  </StatusBadge>
                  {company.orgNumber ? <StatusBadge tone="neutral">{company.orgNumber}</StatusBadge> : null}
                </div>
              </div>
            </div>
          </DialogHeader>

          <ModalBody className="space-y-4">
            <ModalMetaCard>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-[var(--ui-text-muted)]">
                      Företagsprofil
                    </p>
                    <p className="mt-1 text-sm text-[var(--ui-text)]">Adress, webbplats och snabba genvägar.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => onEdit(company)}>
                    <Pencil size={14} strokeWidth={1.75} />
                    Redigera
                  </Button>
                </div>

                {addressLines.length > 0 ? (
                  <div className="space-y-1 text-sm leading-6 text-[var(--ui-text-secondary)]">
                    {addressLines.map((line) => <p key={line}>{line}</p>)}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--ui-text-muted)]">Ingen adress tillagd ännu.</p>
                )}

                {company.website ? (
                  <Link
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[var(--ui-accent)] hover:underline"
                  >
                    <Globe size={14} strokeWidth={1.75} />
                    {company.website.replace(/^https?:\/\//, '')}
                    <ExternalLink size={12} strokeWidth={1.75} />
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
                  <div key={member.id} className="flex items-center justify-between gap-3 rounded-[var(--ui-radius-lg)] bg-[var(--ui-surface)] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--ui-text)]">{getDisplayName(member.user)}</p>
                      <p className="truncate text-xs text-[var(--ui-text-muted)]">{member.user.email}</p>
                    </div>
                    <StatusBadge tone={isAdmin ? 'accent' : 'neutral'}>{isAdmin ? 'Admin' : 'Staff'}</StatusBadge>
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
                <div key={template.id} className="rounded-[var(--ui-radius-lg)] bg-[var(--ui-surface)] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <FileText size={14} strokeWidth={1.75} className="text-[var(--ui-accent)]" />
                    <p className="truncate text-sm font-medium text-[var(--ui-text)]">{template.name}</p>
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
                <div key={product.id} className="rounded-[var(--ui-radius-lg)] bg-[var(--ui-surface)] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Package size={14} strokeWidth={1.75} className="text-[var(--ui-accent)]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--ui-text)]">{product.name}</p>
                      {product.category ? <p className="truncate text-xs text-[var(--ui-text-muted)]">{product.category}</p> : null}
                    </div>
                  </div>
                </div>
              ))}
            </SummaryList>

            {state.error ? <InlineAlert tone="danger">{state.error}</InlineAlert> : null}
          </ModalBody>

          <div className="shrink-0 border-t border-[var(--ui-border)] px-4 py-3 sm:px-6">
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

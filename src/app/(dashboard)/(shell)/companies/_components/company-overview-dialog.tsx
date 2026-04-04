'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Buildings, EnvelopeSimple, FileText, Globe, Package, Palette, Users } from '@phosphor-icons/react';
import type { Company } from '@modules/supporting/offers';
import { fetchWithRefresh } from '@shared/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

        const membersJson = await membersRes.json() as {
          data: { members: MemberSummary[] };
        };
        const templatesJson = await templatesRes.json() as { data?: TemplateSummary[] };
        const productsJson = await productsRes.json() as { data?: { products?: ProductSummary[] } };

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
      <DialogContent mobileVariant="fullscreen" showMobileClose className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Företagsöversikt</DialogTitle>
          <DialogDescription>
            Se branding, kopplade medlemmar, mallar och produkter för {company.name}. Allt här styr hur företaget beter sig i offertflödet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="rounded-[30px] border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="border-b border-[var(--border)] p-5 lg:border-b-0 lg:border-r">
                <div className="flex items-start gap-4">
                  {company.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="h-16 w-16 rounded-[24px] border border-[var(--border)] object-cover"
                    />
                  ) : (
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-[24px] border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                      <Buildings size={26} weight="duotone" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Aktivt företagskort</p>
                    <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{company.name}</h2>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                      <span className={`rounded-full border px-2.5 py-1 ${brandingReady ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'}`}>
                        {brandingReady ? 'Branding redo' : 'Branding saknas delvis'}
                      </span>
                    </div>
                    {addressLines.length > 0 && (
                      <div className="mt-4 space-y-1 text-sm leading-6 text-[var(--text-secondary)]">
                        {addressLines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-alt)] p-4">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Palette size={16} weight="duotone" />
                      <span className="text-xs font-semibold uppercase tracking-[0.16em]">Offerttoppen</span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">{company.name}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{company.senderEmail || 'Avsändarmejl saknas'}</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-alt)] p-4">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Globe size={16} weight="duotone" />
                      <span className="text-xs font-semibold uppercase tracking-[0.16em]">Kontakt</span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">{company.website?.replace(/^https?:\/\//, '') || 'Ingen webbplats'}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Logo och webbadress används i mallar och mejl.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Medlemmar</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">Vem som får arbeta i företagets scope.</p>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                  <Users size={18} weight="duotone" />
                </div>
              </div>

              {state.loading ? (
                <div className="mt-4 text-sm text-[var(--text-muted)]">Laddar översikt...</div>
              ) : (
                <>
                  <p className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">{state.members.length}</p>
                  <div className="mt-4 space-y-2">
                    {state.members.slice(0, 4).map((member) => (
                      <div key={member.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{getDisplayName(member.user)}</p>
                          <p className="truncate text-xs text-[var(--text-muted)]">{member.user.email}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                          {member.role}
                        </span>
                      </div>
                    ))}
                    {state.members.length === 0 && <p className="text-sm text-[var(--text-muted)]">Inga medlemmar kopplade ännu.</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onManageMembers(company)}
                    className="mt-4 inline-flex rounded-2xl border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-alt)]"
                  >
                    Hantera medlemmar
                  </button>
                </>
              )}
            </div>

            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Mallar</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">De mallar som används när du skapar offerter.</p>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                  <FileText size={18} weight="duotone" />
                </div>
              </div>

              {state.loading ? (
                <div className="mt-4 text-sm text-[var(--text-muted)]">Laddar mallar...</div>
              ) : (
                <>
                  <p className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">{state.templates.length}</p>
                  <div className="mt-4 space-y-2">
                    {state.templates.slice(0, 4).map((template) => (
                      <div key={template.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{template.name}</p>
                      </div>
                    ))}
                    {state.templates.length === 0 && <p className="text-sm text-[var(--text-muted)]">Inga företagsspecifika mallar ännu.</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenTemplates(company)}
                    className="mt-4 inline-flex rounded-2xl border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-alt)]"
                  >
                    Öppna mallar
                  </button>
                </>
              )}
            </div>

            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Produkter</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">Katalogen som används i offertflödet.</p>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--accent)]">
                  <Package size={18} weight="duotone" />
                </div>
              </div>

              {state.loading ? (
                <div className="mt-4 text-sm text-[var(--text-muted)]">Laddar produkter...</div>
              ) : (
                <>
                  <p className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">{state.products.length}</p>
                  <div className="mt-4 space-y-2">
                    {state.products.slice(0, 4).map((product) => (
                      <div key={product.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{product.name}</p>
                        {product.category && <p className="truncate text-xs text-[var(--text-muted)]">{product.category}</p>}
                      </div>
                    ))}
                    {state.products.length === 0 && <p className="text-sm text-[var(--text-muted)]">Inga produkter kopplade ännu.</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenProducts(company)}
                    className="mt-4 inline-flex rounded-2xl border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-alt)]"
                  >
                    Öppna produktbibliotek
                  </button>
                </>
              )}
            </div>
          </section>

          {state.error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
              {state.error}
            </div>
          )}

          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-0)] p-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onEdit(company)}
                className="inline-flex rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-95"
              >
                Redigera företag
              </button>
              <button
                type="button"
                onClick={() => onManageMembers(company)}
                className="inline-flex rounded-2xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-alt)]"
              >
                Hantera användare
              </button>
              {company.website && (
                <Link
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-alt)]"
                >
                  <EnvelopeSimple size={15} weight="duotone" />
                  Besök webbplats
                </Link>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

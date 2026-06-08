'use client';

import { Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Copy, LoaderCircle, Plus, Search, Users, X } from 'lucide-react';
import { useActiveCompany } from '@shared/hooks/use-active-company';
import { replaceBrowserQuery } from '@shared/lib/browser-query';
import { cn } from '@shared/lib/utils';
import {
  createLead,
  listLeads,
  type CreateLeadPayload,
  type Lead,
  type LeadSource,
  type LeadStatus,
} from '@shared/lib/api/leads.api';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Input } from '@shared/ui/input';
import { Pagination } from '@shared/ui/pagination';
import { Panel } from '@shared/ui/panel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';
import { Textarea } from '@shared/ui/textarea';
import ToastContainer from '@shared/ui/toast/toast-container';
import { useToast } from '@shared/ui/toast/toast-context';

const STATUS_TABS: { key: LeadStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Alla' },
  { key: 'new', label: 'Nya' },
  { key: 'contacted', label: 'Kontaktade' },
  { key: 'qualified', label: 'Kvalificerade' },
  { key: 'proposal', label: 'Offert' },
  { key: 'won', label: 'Vunna' },
  { key: 'lost', label: 'Förlorade' },
];

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Ny',
  contacted: 'Kontaktad',
  qualified: 'Kvalificerad',
  proposal: 'Offert',
  won: 'Vunnen',
  lost: 'Förlorad',
};

const STATUS_TONE: Record<LeadStatus, StatusTone> = {
  new: 'accent',
  contacted: 'info',
  qualified: 'accent',
  proposal: 'warning',
  won: 'success',
  lost: 'danger',
};

const SOURCE_LABEL: Record<LeadSource, string> = {
  voice_call: 'Röstsamtal',
  web_form: 'Webbformulär',
  manual: 'Manuellt',
  referral: 'Remiss',
  n8n_webhook: 'n8n',
};

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  company: '',
  status: 'new' as LeadStatus,
  source: 'manual' as LeadSource,
  estimatedValue: '',
  notes: '',
};

const PAGE_SIZE = 50;

function parsePageParam(page: string | null) {
  const parsed = Number(page);
  return Number.isFinite(parsed) && parsed > 1 ? parsed - 1 : 0;
}

function parseLeadStatus(status: string | null): LeadStatus | 'all' {
  return STATUS_TABS.some((tab) => tab.key === status) ? (status as LeadStatus | 'all') : 'all';
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function LeadsPageInner() {
  const searchParams = useSearchParams();
  const { selectedCompanyId, selectedCompany } = useActiveCompany();
  const { toasts, addToast, dismissToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<LeadStatus | 'all'>(() => parseLeadStatus(searchParams.get('status')));
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [currentPage, setCurrentPage] = useState(() => parsePageParam(searchParams.get('page')));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [copiedLeadValue, setCopiedLeadValue] = useState<string | null>(null);

  const load = useCallback(async (status?: LeadStatus, q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listLeads({
        status,
        search: q,
        companyId: selectedCompanyId || undefined,
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
      });
      setLeads(result.leads);
      setTotal(result.total);
    } catch {
      setError('Kunde inte ladda leads. Kontrollera anslutningen och försök igen.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCompanyId]);

  useEffect(() => {
    void load(tab === 'all' ? undefined : tab, search || undefined);
  }, [load, search, tab]);

  useEffect(() => {
    replaceBrowserQuery({
      status: tab === 'all' ? null : tab,
      search: search.trim() || null,
      page: currentPage > 0 ? currentPage + 1 : null,
    });
  }, [currentPage, search, tab]);

  const saveLead = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const body: CreateLeadPayload = { name: form.name, status: form.status, source: form.source };
      if (form.email) body.email = form.email;
      if (form.phone) body.phone = form.phone;
      if (form.company) body.company = form.company;
      if (form.notes) body.notes = form.notes;
      if (form.estimatedValue) body.estimatedValue = parseFloat(form.estimatedValue);

      await createLead(body);
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load(tab === 'all' ? undefined : tab, search || undefined);
    } catch {
      setError('Kunde inte spara lead. Kontrollera anslutningen och försök igen.');
    } finally {
      setSaving(false);
    }
  }, [form, load, search, tab]);

  const showCopiedToast = useCallback((message: string) => {
    addToast({ message, color: 'emerald', icon: <Check size={14} strokeWidth={2} /> });
  }, [addToast]);

  const copyLeadValue = useCallback(async (key: string, value: string, label: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value).catch(() => {});
    setCopiedLeadValue(key);
    showCopiedToast(`${label} kopierad`);
    window.setTimeout(() => setCopiedLeadValue(null), 1800);
  }, [showCopiedToast]);

  const copyCurrentViewLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopiedLeadValue('view');
    showCopiedToast('Vy-länk kopierad');
    window.setTimeout(() => setCopiedLeadValue(null), 1800);
  }, [showCopiedToast]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters = tab !== 'all' || Boolean(search);

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageChrome
        total={total}
        companyName={selectedCompany?.name}
        onNew={() => setShowForm(true)}
      />

      {error ? (
        <InlineAlert
          tone="danger"
          title="Leads kunde inte uppdateras"
          className="items-center justify-between"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span>{error}</span>
            <Button type="button" variant="secondary" size="compact" onClick={() => void load(tab === 'all' ? undefined : tab, search || undefined)}>
              Försök igen
            </Button>
          </div>
        </InlineAlert>
      ) : null}

      <Panel padding="sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex gap-1 overflow-x-auto rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-1">
            {STATUS_TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setTab(item.key);
                  setCurrentPage(0);
                }}
                className={cn(
                  'h-8 whitespace-nowrap rounded-[var(--ui-radius-sm)] px-3 text-sm font-medium text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2',
                  tab === item.key && 'border border-[var(--ui-accent-border)] bg-[var(--ui-surface-selected)] text-[var(--ui-text)]',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-0 flex-1 lg:max-w-sm">
            <Search size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
            <Input
              type="search"
              placeholder="Sök lead..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(0);
              }}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2 lg:ml-auto">
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="secondary"
                size="compact"
                onClick={() => {
                  setTab('all');
                  setSearch('');
                  setCurrentPage(0);
                }}
              >
                <X size={16} strokeWidth={1.75} />
                Rensa filter
              </Button>
            ) : null}
            <Button type="button" variant="secondary" size="compact" onClick={() => void copyCurrentViewLink()}>
              {copiedLeadValue === 'view' ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={1.75} />}
              Kopiera vy
            </Button>
          </div>
        </div>
      </Panel>

      {showForm ? (
        <LeadForm
          form={form}
          saving={saving}
          onChange={setForm}
          onCancel={() => {
            setShowForm(false);
            setForm(EMPTY_FORM);
          }}
          onSave={() => void saveLead()}
        />
      ) : null}

      {loading ? (
        <Panel className="grid min-h-64 place-items-center">
          <div className="flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
            <LoaderCircle size={18} strokeWidth={1.75} className="animate-spin" />
            Laddar leads...
          </div>
        </Panel>
      ) : (
        <Panel padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--ui-border)] text-sm">
              <thead className="sticky top-0 bg-[var(--ui-surface-subtle)]">
                <tr>
                  {['Namn', 'Ärende', 'Kontakt', 'Källa', 'Kund', 'Värde', 'Status', 'Skapad'].map((header) => (
                    <th key={header} className="h-10 px-4 text-left text-xs font-semibold uppercase text-[var(--ui-text-muted)]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ui-border)] bg-[var(--ui-surface)]">
                {leads.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    copiedLeadValue={copiedLeadValue}
                    onCopy={copyLeadValue}
                  />
                ))}
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon={Users}
                        title="Inga leads hittades"
                        description={tab !== 'all' ? `Det finns inga leads med status ${STATUS_LABEL[tab].toLowerCase()}.` : 'Skapa ett nytt lead eller justera sökningen.'}
                        actionLabel="Ny lead"
                        onAction={() => setShowForm(true)}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {total > 0 ? (
            <Pagination
              page={currentPage + 1}
              pageCount={totalPages}
              label="Leadsidor"
              onPrevious={currentPage > 0 ? () => setCurrentPage((page) => Math.max(0, page - 1)) : undefined}
              onNext={currentPage < totalPages - 1 ? () => setCurrentPage((page) => page + 1) : undefined}
            />
          ) : null}
        </Panel>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function LeadsPage() {
  return <Suspense><LeadsPageInner /></Suspense>;
}

function PageChrome({ total, companyName, onNew }: { total: number; companyName?: string; onNew: () => void }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Till CRM">
            <Link href="/crm"><ArrowLeft size={16} strokeWidth={1.75} /></Link>
          </Button>
          <h1 className="text-xl font-semibold text-[var(--ui-text)]">Leads</h1>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-[var(--ui-text-muted)]">
          Hantera inkommande leads från röstsamtal, webbformulär och andra kanaler.
        </p>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="neutral">{total} leads totalt</StatusBadge>
          {companyName ? <StatusBadge tone="accent">{companyName}</StatusBadge> : null}
        </div>
      </div>
      <Button type="button" onClick={onNew}>
        <Plus size={16} strokeWidth={1.75} />
        Ny lead
      </Button>
    </header>
  );
}

type LeadFormState = typeof EMPTY_FORM;

function LeadForm({
  form,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  form: LeadFormState;
  saving: boolean;
  onChange: (next: LeadFormState | ((current: LeadFormState) => LeadFormState)) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const setField = <Key extends keyof LeadFormState>(key: Key, value: LeadFormState[Key]) => {
    onChange((current) => ({ ...current, [key]: value }));
  };

  return (
    <Panel variant="selected" className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--ui-text)]">Ny lead</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Namn *"><Input value={form.name} onChange={(event) => setField('name', event.target.value)} /></Field>
        <Field label="Företag"><Input value={form.company} onChange={(event) => setField('company', event.target.value)} /></Field>
        <Field label="E-post"><Input type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} /></Field>
        <Field label="Telefon"><Input type="tel" value={form.phone} onChange={(event) => setField('phone', event.target.value)} /></Field>
        <Field label="Källa">
          <Select value={form.source} onValueChange={(value) => setField('source', value as LeadSource)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(SOURCE_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Estimerat värde (kr)">
          <Input type="number" min={0} value={form.estimatedValue} onChange={(event) => setField('estimatedValue', event.target.value)} />
        </Field>
        <Field label="Anteckningar" className="sm:col-span-2">
          <Textarea rows={2} value={form.notes} onChange={(event) => setField('notes', event.target.value)} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onSave} disabled={saving || !form.name} loading={saving}>Spara lead</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Avbryt</Button>
      </div>
    </Panel>
  );
}

function LeadRow({ lead, copiedLeadValue, onCopy }: { lead: Lead; copiedLeadValue: string | null; onCopy: (key: string, value: string, label: string) => void }) {
  return (
    <tr className="h-10 transition-colors hover:bg-[var(--ui-surface-hover)] focus-within:bg-[var(--ui-surface-selected)]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={lead.name} />
          <span className="max-w-40 truncate font-medium text-[var(--ui-text)]">{lead.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-[var(--ui-text-secondary)]">
        <p className="max-w-56 truncate font-medium text-[var(--ui-text)]">{lead.requestedService ?? lead.company ?? <span className="text-[var(--ui-text-muted)]">-</span>}</p>
        {lead.address || lead.postalCode ? <p className="max-w-56 truncate text-xs text-[var(--ui-text-muted)]">{[lead.address, lead.postalCode].filter(Boolean).join(', ')}</p> : null}
      </td>
      <td className="px-4 py-3 text-xs text-[var(--ui-text-muted)]">
        {lead.email ? <CopyableLeadValue value={lead.email} label="e-post" copied={copiedLeadValue === `email:${lead.id}`} onCopy={() => onCopy(`email:${lead.id}`, lead.email ?? '', 'E-post')} href={`mailto:${lead.email}`} action="Maila" /> : null}
        {lead.phone ? <CopyableLeadValue value={lead.phone} label="telefon" copied={copiedLeadValue === `phone:${lead.id}`} onCopy={() => onCopy(`phone:${lead.id}`, lead.phone ?? '', 'Telefon')} href={`tel:${lead.phone}`} action="Ring" /> : null}
        {!lead.email && !lead.phone ? '-' : null}
      </td>
      <td className="px-4 py-3 text-[var(--ui-text-secondary)]">
        <p>{lead.sourceLabel ?? SOURCE_LABEL[lead.source]}</p>
        {lead.referralSource ? <p className="max-w-44 truncate text-xs text-[var(--ui-text-muted)]">{lead.referralSource}</p> : null}
      </td>
      <td className="px-4 py-3">{lead.customerId ? <StatusBadge tone="success">Länkad</StatusBadge> : lead.score != null ? <StatusBadge tone="accent">Score {lead.score}</StatusBadge> : <span className="text-[var(--ui-text-muted)]">-</span>}</td>
      <td className="px-4 py-3 text-[var(--ui-text-secondary)]">{lead.estimatedValue != null ? new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(lead.estimatedValue) : <span className="text-[var(--ui-text-muted)]">-</span>}</td>
      <td className="px-4 py-3"><StatusBadge tone={STATUS_TONE[lead.status]}>{STATUS_LABEL[lead.status]}</StatusBadge></td>
      <td className="px-4 py-3 text-[var(--ui-text-muted)]">{fmt(lead.createdAt)}</td>
    </tr>
  );
}

function CopyableLeadValue({ value, label, copied, onCopy, href, action }: { value: string; label: string; copied: boolean; onCopy: () => void; href: string; action: string }) {
  return (
    <div className="group flex max-w-56 items-center gap-1.5">
      <span className="truncate">{value}</span>
      <button type="button" onClick={onCopy} title={`Kopiera ${label}`} aria-label={`Kopiera ${label}`} className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--ui-radius-sm)] text-[var(--ui-text-muted)] opacity-0 transition hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-accent)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] group-hover:opacity-100">
        {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
      </button>
      <a href={href} className="text-xs font-medium text-[var(--ui-accent)] hover:underline">{action}</a>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return <label className={cn('space-y-1.5 text-xs font-semibold text-[var(--ui-text-secondary)]', className)}><span>{label}</span>{children}</label>;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();
  return <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--ui-accent-border)] bg-[var(--ui-accent-subtle)] text-[10px] font-bold text-[var(--ui-accent)]">{initials}</span>;
}

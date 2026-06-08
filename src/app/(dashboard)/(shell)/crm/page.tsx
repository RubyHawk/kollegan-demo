'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, FileText, Plus, Search, Users } from 'lucide-react';
import { listCustomers } from '@shared/lib/api/customers.api';
import { listLeads, type Lead } from '@shared/lib/api/leads.api';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { InlineAlert } from '@shared/ui/inline-alert';
import { Input } from '@shared/ui/input';
import { Panel } from '@shared/ui/panel';
import { StatusBadge, type StatusTone } from '@shared/ui/status-badge';

interface Stats {
  contacts: number;
  leads: number;
  leadsNew: number;
  leadsWon: number;
}

type RecentLead = Pick<Lead, 'id' | 'name' | 'company' | 'status' | 'createdAt'>;

const STATUS_LABEL: Record<string, string> = {
  new: 'Ny',
  contacted: 'Kontaktad',
  qualified: 'Kvalificerad',
  proposal: 'Offert',
  won: 'Vunnen',
  lost: 'Förlorad',
};

const STATUS_TONE: Record<string, StatusTone> = {
  new: 'accent',
  contacted: 'info',
  qualified: 'info',
  proposal: 'warning',
  won: 'success',
  lost: 'danger',
};

const initials = (name: string) => name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });

function CrmPageInner() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [leadsResult, contactsResult] = await Promise.all([
          listLeads({ limit: 100, offset: 0 }),
          listCustomers({ limit: 1, offset: 0 }),
        ]);

        setRecentLeads(leadsResult.leads.slice(0, 5));
        setStats({
          contacts: contactsResult.total,
          leads: leadsResult.total,
          leadsNew: leadsResult.leads.filter((lead) => lead.status === 'new').length,
          leadsWon: leadsResult.leads.filter((lead) => lead.status === 'won').length,
        });
      } catch {
        setError('Kunde inte ladda statistik. Kontrollera anslutningen och försök igen.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (search.trim()) window.location.href = `/crm/contacts?search=${encodeURIComponent(search.trim())}`;
  };

  const statCards = stats ? [
    { label: 'Kontakter', value: stats.contacts, href: '/crm/contacts', tone: 'accent' as StatusTone },
    { label: 'Leads totalt', value: stats.leads, href: '/crm/leads', tone: 'info' as StatusTone },
    { label: 'Nya leads', value: stats.leadsNew, href: '/crm/leads', tone: 'accent' as StatusTone },
    { label: 'Vunna leads', value: stats.leadsWon, href: '/crm/leads', tone: 'success' as StatusTone },
  ] : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ui-text)]">CRM</h1>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">Kunder, kontakter och ärendehistorik.</p>
        </div>
        <Button asChild>
          <Link href="/crm/contacts">
            <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
            Ny kontakt
          </Link>
        </Button>
      </div>

      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {loading || !stats ? (
          [0, 1, 2, 3].map((index) => (
            <Panel key={index} padding="md" className="h-20 animate-pulse bg-[var(--ui-surface-subtle)]" />
          ))
        ) : (
          statCards.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Panel padding="md" className="text-center transition-colors hover:bg-[var(--ui-surface-hover)]">
                <p className="text-2xl font-bold tabular-nums text-[var(--ui-text)]">{stat.value}</p>
                <div className="mt-1 flex justify-center">
                  <StatusBadge tone={stat.tone}>{stat.label}</StatusBadge>
                </div>
              </Panel>
            </Link>
          ))
        )}
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search aria-hidden="true" size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
          <Input
            type="search"
            placeholder="Sök kund eller kontakt..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Sök
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { href: '/crm/contacts', label: 'Kontakter', desc: 'Alla kunder och individer', icon: Users },
          { href: '/crm/leads', label: 'Leads', desc: 'Pipeline och konvertering', icon: Activity },
          { href: '/offers', label: 'Offerter', desc: 'Skapa och följ upp offerter', icon: FileText },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Panel padding="md" className="flex items-center gap-3 transition-colors hover:bg-[var(--ui-surface-hover)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-secondary)]">
                  <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--ui-text)]">{item.label}</p>
                  <p className="text-xs text-[var(--ui-text-muted)]">{item.desc}</p>
                </div>
              </Panel>
            </Link>
          );
        })}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--ui-text-secondary)]">Senaste leads</p>
          <Button asChild variant="link" size="compact" className="h-auto px-0 text-xs">
            <Link href="/crm/leads">Visa alla</Link>
          </Button>
        </div>
        <Panel padding="none" className="overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-sm text-[var(--ui-text-muted)]">Laddar...</div>
          ) : recentLeads.length === 0 ? (
            <EmptyState title="Inga leads ännu" description="Nya leads visas här när de har skapats." />
          ) : (
            <ul className="divide-y divide-[var(--ui-border-subtle)]">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--ui-surface-hover)]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-xs font-bold text-[var(--ui-text-secondary)]">
                    {initials(lead.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--ui-text)]">{lead.name}</p>
                    <p className="truncate text-xs text-[var(--ui-text-muted)]">{lead.company ?? fmtDate(lead.createdAt)}</p>
                  </div>
                  <StatusBadge tone={STATUS_TONE[lead.status] ?? 'neutral'}>
                    {STATUS_LABEL[lead.status] ?? lead.status}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>
    </div>
  );
}

export default function CrmPage() {
  return <Suspense><CrmPageInner /></Suspense>;
}

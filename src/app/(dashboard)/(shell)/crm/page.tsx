'use client';

/**
 * /crm
 *
 * CRM overview — live stats from Customers, Leads, and CRM records.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { listCustomers } from '@shared/lib/api/customers.api';
import { listLeads, type Lead } from '@shared/lib/api/leads.api';

interface Stats {
  contacts: number;
  leads:    number;
  leadsNew: number;
  leadsWon: number;
}

type RecentLead = Pick<Lead, 'id' | 'name' | 'company' | 'status' | 'createdAt'>;

const STATUS_BADGE: Record<string, string> = {
  new:       'bg-[var(--accent)]/10 text-[var(--accent)]',
  contacted: 'bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400',
  qualified: 'bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-400',
  proposal:  'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400',
  won:       'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
  lost:      'bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-400',
};

const STATUS_LABEL: Record<string, string> = {
  new: 'Ny', contacted: 'Kontaktad', qualified: 'Kvalificerad',
  proposal: 'Offert', won: 'Vunnen', lost: 'Förlorad',
};

const AVATAR_COLORS = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-sky-500'];
const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
const initials    = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const fmtDate     = (iso: string)  => new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });

export default function CrmPage() {
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState('');

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
          leads:    leadsResult.total,
          leadsNew: leadsResult.leads.filter(l => l.status === 'new').length,
          leadsWon: leadsResult.leads.filter(l => l.status === 'won').length,
        });
      } catch {
        setError('Kunde inte ladda statistik. Kontrollera anslutningen och försök igen.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) window.location.href = `/crm/contacts?search=${encodeURIComponent(search.trim())}`;
  };

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">CRM</h1>
          <p className="text-sm text-[var(--text-muted)]">Kunder, kontakter och ärendehistorik.</p>
        </div>
        <Link
          href="/crm/contacts"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ny kontakt
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading ? (
          [0,1,2,3].map(i => <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 animate-pulse h-20" />)
        ) : stats ? [
          { label: 'Kontakter',    value: stats.contacts,  href: '/crm/contacts',          color: 'text-[var(--accent)]' },
          { label: 'Leads totalt', value: stats.leads,     href: '/crm/leads',             color: 'text-violet-600 dark:text-violet-400' },
          { label: 'Nya leads',    value: stats.leadsNew,  href: '/crm/leads',             color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Vunna leads',  value: stats.leadsWon,  href: '/crm/leads',             color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(s => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center hover:bg-[var(--surface-hover)] transition-colors group">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 group-hover:text-[var(--text-secondary)] transition-colors">{s.label}</p>
          </Link>
        )) : !error ? (
          [0,1,2,3].map(i => <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 animate-pulse h-20" />)
        ) : null}
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
        <div className="flex-1 relative max-w-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Sök kund eller kontakt…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
          Sök
        </button>
      </form>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: '/crm/contacts', label: 'Kontakter', desc: 'Alla kunder och individer', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          )},
          { href: '/crm/leads', label: 'Leads', desc: 'Pipeline och konvertering', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          )},
          { href: '/offers', label: 'Offerter', desc: 'Skapa och följ upp offerter', icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
              <line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="16" y2="13" />
            </svg>
          )},
        ].map(l => (
          <Link key={l.href} href={l.href} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:bg-[var(--surface-hover)] transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
              {l.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{l.label}</p>
              <p className="text-xs text-[var(--text-muted)]">{l.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent leads */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[var(--text-secondary)]">Senaste leads</p>
          <Link href="/crm/leads" className="text-xs text-[var(--accent)] hover:underline">Visa alla →</Link>
        </div>
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-[var(--text-muted)] text-center">Laddar…</div>
          ) : recentLeads.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--text-muted)]">Inga leads ännu</div>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {recentLeads.map(l => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-3 bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors">
                  <div className={`w-8 h-8 rounded-full ${avatarColor(l.id)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {initials(l.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{l.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{l.company ?? fmtDate(l.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[l.status] ?? ''}`}>
                    {STATUS_LABEL[l.status] ?? l.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}

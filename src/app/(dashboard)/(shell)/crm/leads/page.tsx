'use client';

/**
 * /crm/leads
 *
 * Lead management — list, filter by status, and create new leads.
 * Connected to GET /api/leads and POST /api/leads.
 */

import { useState, useEffect, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
type LeadSource = 'voice_call' | 'web_form' | 'manual' | 'referral' | 'n8n_webhook';

interface Lead {
  id:             string;
  name:           string;
  email:          string | null;
  phone:          string | null;
  company:        string | null;
  status:         LeadStatus;
  source:         LeadSource;
  score:          number | null;
  estimatedValue: number | null;
  assignedTo:     string | null;
  notes:          string | null;
  createdAt:      string;
}

const STATUS_TABS: { key: LeadStatus | 'all'; label: string }[] = [
  { key: 'all',       label: 'Alla' },
  { key: 'new',       label: 'Nya' },
  { key: 'contacted', label: 'Kontaktade' },
  { key: 'qualified', label: 'Kvalificerade' },
  { key: 'proposal',  label: 'Offert' },
  { key: 'won',       label: 'Vunna' },
  { key: 'lost',      label: 'Förlorade' },
];

const STATUS_BADGE: Record<LeadStatus, string> = {
  new:       'bg-[var(--accent)]/10 text-[var(--accent)]',
  contacted: 'bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400',
  qualified: 'bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-400',
  proposal:  'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400',
  won:       'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
  lost:      'bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-400',
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  new:       'Ny',
  contacted: 'Kontaktad',
  qualified: 'Kvalificerad',
  proposal:  'Offert',
  won:       'Vunnen',
  lost:      'Förlorad',
};

const SOURCE_LABEL: Record<LeadSource, string> = {
  voice_call:   'Röstsamtal',
  web_form:     'Webbformulär',
  manual:       'Manuellt',
  referral:     'Remiss',
  n8n_webhook:  'n8n',
};

const EMPTY_FORM = {
  name: '', email: '', phone: '', company: '',
  status: 'new' as LeadStatus,
  source: 'manual' as LeadSource,
  estimatedValue: '',
  notes: '',
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tab, setTab]           = useState<LeadStatus | 'all'>('all');
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async (status?: LeadStatus, q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (q)      params.set('search', q);
      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) throw new Error(`Misslyckades att ladda leads (${res.status})`);
      const json = await res.json() as { leads: Lead[]; total: number };
      setLeads(json.leads);
      setTotal(json.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab === 'all' ? undefined : tab, search || undefined);
  }, [load, tab, search]);

  const saveLead = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name:   form.name,
        status: form.status,
        source: form.source,
      };
      if (form.email)          body.email          = form.email;
      if (form.phone)          body.phone          = form.phone;
      if (form.company)        body.company        = form.company;
      if (form.notes)          body.notes          = form.notes;
      if (form.estimatedValue) body.estimatedValue = parseFloat(form.estimatedValue);

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Misslyckades att skapa lead (${res.status})`);
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load(tab === 'all' ? undefined : tab, search || undefined);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [form, load, tab, search]);

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const AVATAR_COLORS = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-sky-500'];
  const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a href="/crm" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
              </svg>
            </a>
            <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Leads</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Hantera inkommande leads från röstsamtal, webbformulär och andra kanaler.
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[var(--surface-alt)] border border-[var(--border)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
              {total} leads totalt
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ny lead
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex gap-1 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-1 overflow-x-auto shrink-0">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                tab === t.key
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Sök lead…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
      </div>

      {/* New lead form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Ny lead</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Namn *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Företag</label>
              <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">E-post</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Telefon</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Källa</label>
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as LeadSource }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors">
                <option value="manual">Manuellt</option>
                <option value="voice_call">Röstsamtal</option>
                <option value="web_form">Webbformulär</option>
                <option value="referral">Remiss</option>
                <option value="n8n_webhook">n8n</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Estimerat värde (kr)</label>
              <input type="number" min={0} value={form.estimatedValue} onChange={e => setForm(f => ({ ...f, estimatedValue: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Anteckningar</label>
              <textarea value={form.notes} rows={2} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => void saveLead()} disabled={saving || !form.name}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? 'Sparar…' : 'Spara lead'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead className="bg-[var(--surface-alt)]">
                <tr>
                  {['Namn', 'Företag', 'Kontakt', 'Källa', 'Poäng', 'Värde', 'Status', 'Skapad'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                {leads.map(l => (
                  <tr key={l.id} className="hover:bg-[var(--surface-alt)] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full ${avatarColor(l.id)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                          {initials(l.name)}
                        </div>
                        <span className="font-medium text-[var(--text-primary)] truncate max-w-[160px]">{l.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-secondary)]">{l.company ?? <span className="text-[var(--text-muted)]">—</span>}</td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)] text-xs">
                      {l.email && <div>{l.email}</div>}
                      {l.phone && <div>{l.phone}</div>}
                      {!l.email && !l.phone && '—'}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-secondary)]">{SOURCE_LABEL[l.source]}</td>
                    <td className="px-4 py-3.5">
                      {l.score != null ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold">
                          {l.score}
                        </span>
                      ) : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-secondary)]">
                      {l.estimatedValue != null
                        ? new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(l.estimatedValue)
                        : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[l.status]}`}>
                        {STATUS_LABEL[l.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmt(l.createdAt)}</td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                      Inga leads{tab !== 'all' ? ` med status "${STATUS_LABEL[tab as LeadStatus]?.toLowerCase()}"` : ''} — klicka på Ny lead för att lägga till.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Laddar leads…</p>
        </div>
      )}
    </div>
  );
}

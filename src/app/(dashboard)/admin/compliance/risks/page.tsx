/**
 * /admin/compliance/risks
 *
 * ISO 27001 risk register — CRUD for information security risks.
 * Risk score = likelihood × impact (1-25). Computed server-side.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Treatment = 'accept' | 'mitigate' | 'transfer' | 'avoid';
type RiskStatus = 'open' | 'in_progress' | 'resolved' | 'accepted';

interface Risk {
  id:            string;
  asset:         string;
  threat:        string;
  vulnerability: string;
  likelihood:    number;
  impact:        number;
  riskScore:     number;
  treatment:     Treatment;
  treatmentDesc: string | null;
  owner:         string | null;
  dueDate:       string | null;
  status:        RiskStatus;
  createdAt:     string;
}

const STATUS_TABS: { key: RiskStatus | 'all'; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'open',        label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved',    label: 'Resolved' },
  { key: 'accepted',    label: 'Accepted' },
];

function riskColor(score: number): string {
  if (score <= 6)  return 'bg-green-100 text-green-800';
  if (score <= 14) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_FORM = {
  asset: '', threat: '', vulnerability: '',
  likelihood: 3, impact: 3,
  treatment: 'mitigate' as Treatment,
  treatmentDesc: '', owner: '', dueDate: '',
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function RisksPage() {
  const [risks, setRisks]         = useState<Risk[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [tab, setTab]             = useState<RiskStatus | 'all'>('all');
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async (status?: RiskStatus) => {
    setLoading(true);
    setError(null);
    try {
      const qs = status ? `?status=${status}` : '';
      const res = await fetch(`/api/admin/compliance/risks${qs}`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const json = await res.json() as { data: Risk[]; pagination: { total: number } };
      setRisks(json.data);
      setTotal(json.pagination?.total ?? json.data.length);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(tab === 'all' ? undefined : tab); }, [load, tab]);

  const saveRisk = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const body = {
        asset:         form.asset,
        threat:        form.threat,
        vulnerability: form.vulnerability,
        likelihood:    form.likelihood,
        impact:        form.impact,
        treatment:     form.treatment,
        treatmentDesc: form.treatmentDesc || undefined,
        owner:         form.owner         || undefined,
        dueDate:       form.dueDate       ? new Date(form.dueDate).toISOString() : undefined,
      };
      const res = await fetch('/api/admin/compliance/risks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to create risk (${res.status})`);
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load(tab === 'all' ? undefined : tab);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [form, load, tab]);

  const deleteRisk = useCallback(async (id: string) => {
    if (!confirm('Delete this risk?')) return;
    try {
      await fetch(`/api/admin/compliance/risks/${id}`, { method: 'DELETE' });
      await load(tab === 'all' ? undefined : tab);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [load, tab]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Risk Register</h1>
            <p className="mt-1 text-sm text-gray-500">
              ISO 27001 — information security risk assessment and treatment. {total} risk{total !== 1 ? 's' : ''} total.
              {' '}<a href="/admin/compliance" className="text-indigo-600 hover:underline">← Controls</a>
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            New Risk
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Tabs */}
        <div className="mb-4 flex gap-1 border-b border-gray-200">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* New risk form */}
        {showForm && (
          <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <h2 className="mb-3 text-sm font-medium text-indigo-900">New Risk</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['asset','threat','vulnerability'] as const).map(field => (
                <div key={field} className={field === 'vulnerability' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-700 capitalize">{field}</label>
                  <input
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700">Likelihood (1-5)</label>
                <input type="number" min={1} max={5} value={form.likelihood}
                  onChange={e => setForm(f => ({ ...f, likelihood: parseInt(e.target.value) }))}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Impact (1-5)</label>
                <input type="number" min={1} max={5} value={form.impact}
                  onChange={e => setForm(f => ({ ...f, impact: parseInt(e.target.value) }))}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  Risk score: <strong className={`rounded px-1 ${riskColor(form.likelihood * form.impact)}`}>{form.likelihood * form.impact}</strong>
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Treatment</label>
                <select value={form.treatment}
                  onChange={e => setForm(f => ({ ...f, treatment: e.target.value as Treatment }))}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm">
                  {(['mitigate','accept','transfer','avoid'] as Treatment[]).map(t => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Owner</label>
                <input value={form.owner}
                  onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Due date</label>
                <input type="date" value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700">Treatment description</label>
                <textarea value={form.treatmentDesc} rows={2}
                  onChange={e => setForm(f => ({ ...f, treatmentDesc: e.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => void saveRisk()} disabled={saving}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Risk'}
              </button>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Asset','Threat','Score','Treatment','Owner','Due','Status',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {risks.map(r => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.asset}</td>
                    <td className="px-4 py-3 max-w-xs text-gray-600 truncate">{r.threat}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${riskColor(r.riskScore)}`}>
                        {r.riskScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">{r.treatment}</td>
                    <td className="px-4 py-3 text-gray-500">{r.owner ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{fmt(r.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-700">{r.status.replace('_',' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => void deleteRisk(r.id)}
                        className="text-xs text-red-500 hover:text-red-700">Delete</button>
                    </td>
                  </tr>
                ))}
                {risks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                      No risks {tab !== 'all' ? `with status "${tab.replace('_',' ')}"` : 'yet'} — click New Risk to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400">Loading risks…</div>
        )}
      </div>
    </div>
  );
}

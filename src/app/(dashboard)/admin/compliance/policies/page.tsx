/**
 * /admin/compliance/policies
 *
 * ISO 27001 policy vault — store, version, and review compliance policies.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type PolicyStatus = 'draft' | 'active' | 'retired';

interface Policy {
  id:              string;
  name:            string;
  category:        string;
  version:         string;
  status:          PolicyStatus;
  owner:           string | null;
  nextReviewDate:  string | null;
  approvedAt:      string | null;
  createdAt:       string;
  updatedAt:       string;
  content:         string;
}

const STATUS_STYLES: Record<PolicyStatus, string> = {
  draft:   'bg-gray-100 text-gray-700',
  active:  'bg-green-100 text-green-700',
  retired: 'bg-red-100 text-red-500',
};

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function reviewDueClass(iso: string | null): string {
  if (!iso) return 'text-gray-500';
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0)                  return 'font-medium text-red-600';   // overdue
  if (diff < 30 * 86_400_000)   return 'font-medium text-amber-600'; // within 30 days
  return 'text-gray-500';
}

const EMPTY_FORM = {
  name: '', category: '', content: '', version: '1.0',
  reviewCycleDays: 365, owner: '',
};

const POLICY_CATEGORIES = [
  'Access Control',
  'Asset Management',
  'Cryptography',
  'Data Retention',
  'Incident Response',
  'Information Classification',
  'Network Security',
  'Password Policy',
  'Physical Security',
  'Risk Assessment',
  'Secure Development',
  'Supplier Management',
  'Vulnerability Management',
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PoliciesPage() {
  const [policies, setPolicies]   = useState<Policy[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [expanded, setExpanded]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/compliance/policies');
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const json = await res.json() as { data: Policy[] };
      setPolicies(json.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const savePolicy = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const body = {
        name:            form.name,
        category:        form.category,
        content:         form.content,
        version:         form.version,
        reviewCycleDays: form.reviewCycleDays,
        owner:           form.owner || undefined,
      };
      const res = await fetch('/api/admin/compliance/policies', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to create policy (${res.status})`);
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [form, load]);

  const deletePolicy = useCallback(async (id: string) => {
    if (!confirm('Delete this policy?')) return;
    try {
      await fetch(`/api/admin/compliance/policies/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [load]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Policy Vault</h1>
            <p className="mt-1 text-sm text-gray-500">
              ISO 27001 — information security policies and review schedule.
              {' '}<a href="/admin/compliance" className="text-indigo-600 hover:underline">← Controls</a>
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            New Policy
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* New policy form */}
        {showForm && (
          <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <h2 className="mb-3 text-sm font-medium text-indigo-900">New Policy</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-700">Name</label>
                <input value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Category</label>
                <select value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm">
                  <option value="">Select category…</option>
                  {POLICY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Version</label>
                <input value={form.version}
                  onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Review cycle (days)</label>
                <input type="number" min={30} max={730} value={form.reviewCycleDays}
                  onChange={e => setForm(f => ({ ...f, reviewCycleDays: parseInt(e.target.value) }))}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Owner</label>
                <input value={form.owner}
                  onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700">Content (Markdown)</label>
                <textarea value={form.content} rows={6}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="# Policy Title&#10;&#10;## Purpose&#10;&#10;## Scope&#10;&#10;## Policy&#10;..."
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 font-mono text-sm" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => void savePolicy()} disabled={saving}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Policy'}
              </button>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Policies table */}
        {!loading && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Name','Category','Version','Status','Owner','Next Review','Approved',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {policies.map(p => (
                  <>
                    <tr key={p.id} className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.category}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">v{p.version}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[p.status]}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.owner ?? '—'}</td>
                      <td className={`px-4 py-3 ${reviewDueClass(p.nextReviewDate)}`}>{fmt(p.nextReviewDate)}</td>
                      <td className="px-4 py-3 text-gray-500">{fmt(p.approvedAt)}</td>
                      <td className="px-4 py-3">
                        <button onClick={e => { e.stopPropagation(); void deletePolicy(p.id); }}
                          className="text-xs text-red-500 hover:text-red-700">Delete</button>
                      </td>
                    </tr>
                    {expanded === p.id && (
                      <tr key={`${p.id}-content`}>
                        <td colSpan={8} className="bg-gray-50 px-6 py-4">
                          <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 max-h-64 overflow-y-auto">
                            {p.content}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {policies.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                      No policies yet — click New Policy to add your first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400">Loading policies…</div>
        )}
      </div>
    </div>
  );
}

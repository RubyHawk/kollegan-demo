/**
 * /admin/compliance/policies
 *
 * ISO 27001 policy vault — store, version, and review compliance policies.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import {
  createPolicy,
  deletePolicy as deletePolicyRequest,
  listPolicies,
  type Policy,
  type PolicyStatus,
} from '@shared/lib/api/compliance.api';

// ─── Types ─────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<PolicyStatus, string> = {
  draft:   'bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--border)]',
  active:  'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400',
  retired: 'bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-400',
};

const STATUS_LABEL: Record<PolicyStatus, string> = {
  draft:   'Utkast',
  active:  'Aktiv',
  retired: 'Arkiverad',
};

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function reviewDueClass(iso: string | null): string {
  if (!iso) return 'text-[var(--text-muted)]';
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0)                return 'font-semibold text-red-600 dark:text-red-400';
  if (diff < 30 * 86_400_000) return 'font-semibold text-amber-600 dark:text-amber-400';
  return 'text-[var(--text-muted)]';
}

const EMPTY_FORM = {
  name: '', category: '', content: '', version: '1.0',
  reviewCycleDays: 365, owner: '',
};

const POLICY_CATEGORIES = [
  'Access Control', 'Asset Management', 'Cryptography', 'Data Retention',
  'Incident Response', 'Information Classification', 'Network Security',
  'Password Policy', 'Physical Security', 'Risk Assessment',
  'Secure Development', 'Supplier Management', 'Vulnerability Management',
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null);
  const [confirmDeletePolicy, setConfirmDeletePolicy] = useState<Policy | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listPolicies({ limit: 50, offset: 0 });
      setPolicies(result.policies);
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
      await createPolicy(body);
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
    setDeletingPolicyId(id);
    try {
      await deletePolicyRequest(id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingPolicyId(null);
      setConfirmDeletePolicy(null);
    }
  }, [load]);

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a href="/admin/compliance" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
              </svg>
            </a>
            <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Policyer</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            ISO 27001 — informationssäkerhetspolicyer och granskningsschema.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ny policy
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

      {/* New policy form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Ny policy</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Namn</label>
              <input value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Kategori</label>
              <select value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors">
                <option value="">Välj kategori…</option>
                {POLICY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Version</label>
              <input value={form.version}
                onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Granskningscykel (dagar)</label>
              <input type="number" min={30} max={730} value={form.reviewCycleDays}
                onChange={e => setForm(f => ({ ...f, reviewCycleDays: parseInt(e.target.value) }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Ägare</label>
              <input value={form.owner}
                onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Innehåll (Markdown)</label>
              <textarea value={form.content} rows={6}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="# Policy Title&#10;&#10;## Syfte&#10;&#10;## Räckvidd&#10;&#10;## Policy&#10;..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => void savePolicy()} disabled={saving}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? 'Sparar…' : 'Spara policy'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors">
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Policies list */}
      {!loading && (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-sm">
              <thead className="bg-[var(--surface-alt)]">
                <tr>
                  {['Namn', 'Kategori', 'Version', 'Status', 'Ägare', 'Nästa granskning', 'Godkänd', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                {policies.map(p => (
                  <>
                    <tr key={p.id}
                      className="cursor-pointer hover:bg-[var(--surface-alt)] transition-colors"
                      onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                      <td className="px-4 py-3.5 font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <svg
                          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          className={`text-[var(--text-muted)] transition-transform ${expanded === p.id ? 'rotate-90' : ''}`}
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                        {p.name}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--text-secondary)]">{p.category}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs bg-[var(--surface-alt)] border border-[var(--border)] rounded-md px-1.5 py-0.5 text-[var(--text-muted)]">
                          v{p.version}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}>
                          {STATUS_LABEL[p.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--text-muted)]">{p.owner ?? '—'}</td>
                      <td className={`px-4 py-3.5 ${reviewDueClass(p.nextReviewDate)}`}>{fmt(p.nextReviewDate)}</td>
                      <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmt(p.approvedAt)}</td>
                      <td className="px-4 py-3.5">
                        <button onClick={e => { e.stopPropagation(); setConfirmDeletePolicy(p); }} disabled={deletingPolicyId === p.id}
                          className="text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-40">
                          Ta bort
                        </button>
                      </td>
                    </tr>
                    {expanded === p.id && (
                      <tr key={`${p.id}-content`}>
                        <td colSpan={8} className="bg-[var(--surface-alt)] px-6 py-5">
                          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Innehåll</p>
                          <pre className="whitespace-pre-wrap font-mono text-xs text-[var(--text-secondary)] max-h-64 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 leading-relaxed">
                            {p.content}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {policies.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                      Inga policyer ännu — klicka på Ny policy för att lägga till din första.
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
          <p className="text-sm text-[var(--text-muted)]">Laddar policyer…</p>
        </div>
      )}
      <ConfirmDestructiveDialog
        open={Boolean(confirmDeletePolicy)}
        onOpenChange={(open) => { if (!open) setConfirmDeletePolicy(null); }}
        title="Ta bort policy?"
        description={
          confirmDeletePolicy
            ? `"${confirmDeletePolicy.name}" tas bort från policyvalvet. Det här går inte att ångra.`
            : 'Policyn tas bort från policyvalvet. Det här går inte att ångra.'
        }
        confirmLabel="Ta bort policy"
        loading={Boolean(confirmDeletePolicy && deletingPolicyId === confirmDeletePolicy.id)}
        onConfirm={() => {
          if (!confirmDeletePolicy) return;
          void deletePolicy(confirmDeletePolicy.id);
        }}
      />
    </div>
  );
}

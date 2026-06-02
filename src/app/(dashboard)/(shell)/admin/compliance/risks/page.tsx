/**
 * /admin/compliance/risks
 *
 * ISO 27001 risk register — CRUD for information security risks.
 * Risk score = likelihood × impact (1-25). Computed server-side.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConfirmDestructiveDialog } from '@shared/ui/confirm-destructive-dialog';
import {
  createRisk,
  deleteRisk as deleteRiskRequest,
  listRisks,
  type Risk,
  type RiskStatus,
  type RiskTreatment,
} from '@shared/lib/api/compliance.api';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Treatment = RiskTreatment;

const STATUS_TABS: { key: RiskStatus | 'all'; label: string }[] = [
  { key: 'all',         label: 'Alla' },
  { key: 'open',        label: 'Öppna' },
  { key: 'in_progress', label: 'Pågående' },
  { key: 'resolved',    label: 'Lösta' },
  { key: 'accepted',    label: 'Accepterade' },
];

const RISK_SCORE_STYLE = (score: number): { badge: string; label: string } => {
  if (score <= 6)  return { badge: 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400', label: 'Låg' };
  if (score <= 14) return { badge: 'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400',         label: 'Medium' };
  return               { badge: 'bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-400',                    label: 'Hög' };
};

const STATUS_BADGE: Record<RiskStatus, string> = {
  open:        'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  in_progress: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  resolved:    'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  accepted:    'bg-[var(--surface-alt)] text-[var(--text-muted)]',
};

const STATUS_LABEL: Record<RiskStatus, string> = {
  open:        'Öppen',
  in_progress: 'Pågående',
  resolved:    'Löst',
  accepted:    'Accepterad',
};

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_FORM = {
  asset: '', threat: '', vulnerability: '',
  likelihood: 3, impact: 3,
  treatment: 'mitigate' as Treatment,
  treatmentDesc: '', owner: '', dueDate: '',
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function RisksPage() {
  const [risks, setRisks]       = useState<Risk[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tab, setTab]           = useState<RiskStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [deletingRiskId, setDeletingRiskId] = useState<string | null>(null);
  const [confirmDeleteRisk, setConfirmDeleteRisk] = useState<Risk | null>(null);

  const load = useCallback(async (status?: RiskStatus) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listRisks({ status, limit: 50, offset: 0 });
      setRisks(result.risks);
      setTotal(result.total);
    } catch {
      setError('Kunde inte ladda risker. Kontrollera anslutningen och försök igen.');
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
      await createRisk(body);
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load(tab === 'all' ? undefined : tab);
    } catch {
      setError('Kunde inte spara. Kontrollera anslutningen och försök igen.');
    } finally {
      setSaving(false);
    }
  }, [form, load, tab]);

  const deleteRisk = useCallback(async (id: string) => {
    setDeletingRiskId(id);
    try {
      await deleteRiskRequest(id);
      await load(tab === 'all' ? undefined : tab);
    } catch {
      setError('Kunde inte ta bort. Försök igen.');
    } finally {
      setDeletingRiskId(null);
      setConfirmDeleteRisk(null);
    }
  }, [load, tab]);

  const scorePreview = form.likelihood * form.impact;
  const scoreStyle   = RISK_SCORE_STYLE(scorePreview);

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
            <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Riskregister</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            ISO 27001 — riskbedömning och hantering av informationssäkerhet.
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[var(--surface-alt)] border border-[var(--border)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
              {total} risker totalt
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
          Ny risk
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

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-1 w-fit">
        {STATUS_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              tab === t.key
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* New risk form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Ny risk</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(['asset', 'threat', 'vulnerability'] as const).map(field => (
              <div key={field} className={field === 'vulnerability' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 capitalize">
                  {field === 'asset' ? 'Tillgång' : field === 'threat' ? 'Hot' : 'Sårbarhet'}
                </label>
                <input
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Sannolikhet (1–5)</label>
              <input type="number" min={1} max={5} value={form.likelihood}
                onChange={e => setForm(f => ({ ...f, likelihood: parseInt(e.target.value) }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Påverkan (1–5)</label>
              <input type="number" min={1} max={5} value={form.impact}
                onChange={e => setForm(f => ({ ...f, impact: parseInt(e.target.value) }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <p className="text-xs text-[var(--text-muted)]">Riskpoäng:</p>
              <span className={`rounded-lg px-3 py-1 text-sm font-bold ${scoreStyle.badge}`}>
                {scorePreview} — {scoreStyle.label}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Åtgärd</label>
              <select value={form.treatment}
                onChange={e => setForm(f => ({ ...f, treatment: e.target.value as Treatment }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors">
                <option value="mitigate">Minska</option>
                <option value="accept">Acceptera</option>
                <option value="transfer">Överför</option>
                <option value="avoid">Undvik</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Ägare</label>
              <input value={form.owner}
                onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Förfallodatum</label>
              <input type="date" value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Åtgärdsbeskrivning</label>
              <textarea value={form.treatmentDesc} rows={2}
                onChange={e => setForm(f => ({ ...f, treatmentDesc: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => void saveRisk()} disabled={saving}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? 'Sparar…' : 'Spara risk'}
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
                  {['Tillgång', 'Hot', 'Poäng', 'Åtgärd', 'Ägare', 'Förfall', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                {risks.map(r => {
                  const rs = RISK_SCORE_STYLE(r.riskScore);
                  return (
                    <tr key={r.id} className="hover:bg-[var(--surface-alt)] transition-colors">
                      <td className="px-4 py-3.5 font-medium text-[var(--text-primary)] max-w-[160px] truncate">{r.asset}</td>
                      <td className="px-4 py-3.5 text-[var(--text-secondary)] max-w-[200px] truncate">{r.threat}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold ${rs.badge}`}>
                          {r.riskScore}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--text-secondary)] capitalize">
                        {r.treatment === 'mitigate' ? 'Minska' : r.treatment === 'accept' ? 'Acceptera' : r.treatment === 'transfer' ? 'Överför' : 'Undvik'}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--text-muted)]">{r.owner ?? '—'}</td>
                      <td className="px-4 py-3.5 text-[var(--text-muted)]">{fmt(r.dueDate)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[r.status]}`}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => setConfirmDeleteRisk(r)} disabled={deletingRiskId === r.id}
                          className="text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-40">
                          Ta bort
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {risks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                      Inga risker {tab !== 'all' ? `med status "${STATUS_LABEL[tab as RiskStatus]?.toLowerCase()}"` : 'ännu'} — klicka på Ny risk för att lägga till.
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
          <p className="text-sm text-[var(--text-muted)]">Laddar risker…</p>
        </div>
      )}
      <ConfirmDestructiveDialog
        open={Boolean(confirmDeleteRisk)}
        onOpenChange={(open) => { if (!open) setConfirmDeleteRisk(null); }}
        title="Ta bort risk?"
        description={
          confirmDeleteRisk
            ? `Risken för "${confirmDeleteRisk.asset}" tas bort från registret. Det här går inte att ångra.`
            : 'Risken tas bort från registret. Det här går inte att ångra.'
        }
        confirmLabel="Ta bort risk"
        loading={Boolean(confirmDeleteRisk && deletingRiskId === confirmDeleteRisk.id)}
        onConfirm={() => {
          if (!confirmDeleteRisk) return;
          void deleteRisk(confirmDeleteRisk.id);
        }}
      />
    </div>
  );
}

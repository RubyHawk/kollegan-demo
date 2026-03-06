/**
 * /admin/compliance
 *
 * ISO 27001 compliance dashboard.
 * Shows all 13 Annex A technological controls with their latest evidence
 * status. Provides "Collect Evidence Now" and "Export Report" actions.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type EvidenceStatus = 'pass' | 'fail' | 'warn' | 'unknown';

interface LatestEvidence {
  status:      EvidenceStatus;
  summary:     string;
  collectedAt: string;
}

interface Control {
  id:             string;
  controlId:      string;
  name:           string;
  description:    string;
  evidenceType:   string;
  latestEvidence: LatestEvidence | null;
}

interface ControlsResponse {
  controls: Control[];
  total:    number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<EvidenceStatus, { dot: string; badge: string; label: string }> = {
  pass:    { dot: 'bg-emerald-500', badge: 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400', label: 'Pass' },
  warn:    { dot: 'bg-amber-400',   badge: 'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400',         label: 'Varning' },
  fail:    { dot: 'bg-red-500',     badge: 'bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-400',                 label: 'Fel' },
  unknown: { dot: 'bg-[var(--border)]', badge: 'bg-[var(--surface-alt)] text-[var(--text-muted)]',                        label: 'Ingen data' },
};

const STATUS_STAT_STYLES: Record<EvidenceStatus, { icon: string; bg: string; label: string; text: string }> = {
  pass:    { icon: '✓', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30', label: 'Godkänd', text: 'text-emerald-700 dark:text-emerald-400' },
  warn:    { icon: '!', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30',         label: 'Varning',  text: 'text-amber-700 dark:text-amber-400' },
  fail:    { icon: '✗', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30',                 label: 'Fel',      text: 'text-red-700 dark:text-red-400' },
  unknown: { icon: '?', bg: 'bg-[var(--surface-alt)] border-[var(--border)]',                                     label: 'Okänd',    text: 'text-[var(--text-muted)]' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1)  return 'just nu';
  if (h < 24) return `${h}h sedan`;
  return `${Math.floor(h / 24)}d sedan`;
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const [data, setData]             = useState<ControlsResponse | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [exporting, setExporting]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/compliance/controls');
      if (!res.ok) {
        if (res.status === 403) throw new Error('Åtkomst nekad — admin-roll krävs');
        throw new Error(`Misslyckades att ladda kontroller (${res.status})`);
      }
      const json = await res.json() as { data: ControlsResponse };
      setData(json.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const collectEvidence = useCallback(async () => {
    setCollecting(true);
    try {
      const res = await fetch('/api/admin/compliance/evidence/collect', { method: 'POST' });
      if (!res.ok) throw new Error(`Insamling misslyckades (${res.status})`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCollecting(false);
    }
  }, [load]);

  const exportReport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/compliance/report');
      if (!res.ok) throw new Error(`Export misslyckades (${res.status})`);
      const json = await res.json() as { data: unknown };
      downloadJson(json.data, `iso27001-evidence-${new Date().toISOString().split('T')[0]}.json`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  }, []);

  const summary = data
    ? data.controls.reduce(
        (acc, c) => { acc[c.latestEvidence?.status ?? 'unknown']++; return acc; },
        { pass: 0, fail: 0, warn: 0, unknown: 0 } as Record<EvidenceStatus, number>
      )
    : null;

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">ISO 27001 Compliance</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
            Annex A teknologiska kontroller — automatisk bevisisamling.
            <span className="text-[var(--border)]">·</span>
            <a href="/admin/compliance/risks" className="text-[var(--accent)] hover:underline">Riskregister</a>
            <span className="text-[var(--border)]">·</span>
            <a href="/admin/compliance/policies" className="text-[var(--accent)] hover:underline">Policyer</a>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => void collectEvidence()}
            disabled={collecting || loading}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors"
          >
            {collecting ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
              </svg>
            )}
            {collecting ? 'Samlar in…' : 'Samla in bevis'}
          </button>
          <button
            onClick={() => void exportReport()}
            disabled={exporting || !data}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {exporting ? 'Exporterar…' : 'Exportera rapport'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* Summary stats */}
      {summary && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['pass', 'warn', 'fail', 'unknown'] as EvidenceStatus[]).map(s => {
            const st = STATUS_STAT_STYLES[s];
            return (
              <div key={s} className={`rounded-2xl border p-4 ${st.bg}`}>
                <div className={`text-xs font-semibold mb-2 ${st.text}`}>{st.label}</div>
                <p className={`text-3xl font-bold ${st.text}`}>{summary[s]}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  av {data?.total ?? 0} kontroller
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Controls grid */}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.controls.map(control => {
            const ev     = control.latestEvidence;
            const status = ev?.status ?? 'unknown';
            const style  = STATUS_STYLES[status];

            return (
              <div key={control.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] px-2 py-1 font-mono text-xs font-semibold text-[var(--text-secondary)]">
                    {control.controlId}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {style.label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{control.name}</p>
                {ev ? (
                  <div className="space-y-1">
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">{ev.summary}</p>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      Kontrollerat {timeAgo(ev.collectedAt)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-muted)] italic">Inga bevis insamlade ännu</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-[var(--text-muted)]">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Laddar kontroller…</p>
        </div>
      )}
    </div>
  );
}

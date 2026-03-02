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
  pass:    { dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700',  label: 'Pass' },
  warn:    { dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700',  label: 'Warn' },
  fail:    { dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700',      label: 'Fail' },
  unknown: { dot: 'bg-gray-300',   badge: 'bg-gray-50 text-gray-500',    label: 'No data' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1)  return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatusDot({ status }: { status: EvidenceStatus }) {
  return (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_STYLES[status].dot}`} />
  );
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
  const [data, setData]           = useState<ControlsResponse | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [exporting, setExporting]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/compliance/controls');
      if (!res.ok) {
        if (res.status === 403) throw new Error('Access denied — admin role required');
        throw new Error(`Failed to load controls (${res.status})`);
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
      if (!res.ok) throw new Error(`Collection failed (${res.status})`);
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
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const json = await res.json() as { data: unknown };
      downloadJson(json.data, `iso27001-evidence-${new Date().toISOString().split('T')[0]}.json`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  }, []);

  // Summary counts
  const summary = data
    ? data.controls.reduce(
        (acc, c) => {
          const s = c.latestEvidence?.status ?? 'unknown';
          acc[s]++;
          return acc;
        },
        { pass: 0, fail: 0, warn: 0, unknown: 0 } as Record<EvidenceStatus, number>
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">ISO 27001 Compliance</h1>
            <p className="mt-1 text-sm text-gray-500">
              Annex A technological controls — automated evidence collection.
              {' '}<a href="/admin/compliance/risks" className="text-indigo-600 hover:underline">Risk register</a>
              {' · '}<a href="/admin/compliance/policies" className="text-indigo-600 hover:underline">Policy vault</a>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void collectEvidence()}
              disabled={collecting || loading}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {collecting ? 'Collecting…' : 'Collect Evidence Now'}
            </button>
            <button
              onClick={() => void exportReport()}
              disabled={exporting || !data}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {exporting ? 'Exporting…' : 'Export Report'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Summary stats */}
        {summary && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(['pass','warn','fail','unknown'] as EvidenceStatus[]).map(s => (
              <div key={s} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <StatusDot status={s} />
                  <p className="text-xs text-gray-500 capitalize">{STATUS_STYLES[s].label}</p>
                </div>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{summary[s]}</p>
              </div>
            ))}
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
                <div key={control.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-medium text-gray-700">
                      {control.controlId}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}>
                      <StatusDot status={status} />
                      {style.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{control.name}</p>
                  {ev && (
                    <>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{ev.summary}</p>
                      <p className="mt-2 text-xs text-gray-400">Last checked {timeAgo(ev.collectedAt)}</p>
                    </>
                  )}
                  {!ev && (
                    <p className="mt-1 text-xs text-gray-400 italic">No evidence collected yet</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            Loading compliance controls…
          </div>
        )}
      </div>
    </div>
  );
}

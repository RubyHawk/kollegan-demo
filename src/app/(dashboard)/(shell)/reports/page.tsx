'use client';

/**
 * /reports
 *
 * Report library — browse and generate pre-built reports as CSV downloads.
 * Pulls data from existing API endpoints and converts to CSV client-side.
 */

import { useState } from 'react';
import { loadReportRows } from '@shared/lib/api/reports.api';

interface Report {
  id:       string;
  name:     string;
  desc:     string;
  category: string;
  color:    string;
  endpoint: string;
}

const REPORTS: Report[] = [
  {
    id: 'contacts-export', name: 'Kontaktexport',
    desc: 'Fullständig export av alla kunder och kontakter med historik.',
    category: 'CRM', color: 'text-[var(--accent)] bg-[var(--accent)]/10',
    endpoint: '/api/v1/kunder?limit=1000&offset=0',
  },
  {
    id: 'leads-export', name: 'Leadsexport',
    desc: 'Alla leads med status, källa, poäng och estimerat värde.',
    category: 'CRM', color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
    endpoint: '/api/v1/leads?limit=1000&offset=0',
  },
  {
    id: 'offers-export', name: 'Offertöversikt',
    desc: 'Alla offerter med status, mottagare och totalsummor.',
    category: 'Försäljning', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    endpoint: '/api/v1/offers?limit=1000&offset=0',
  },
  {
    id: 'projects-export', name: 'Projektöversikt',
    desc: 'Status, framsteg och milstolpar för alla aktiva projekt.',
    category: 'Projekt', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    endpoint: '/api/v1/projekt?limit=1000&offset=0',
  },
  {
    id: 'meetings-export', name: 'Mötesexport',
    desc: 'Alla schemalagda och genomförda möten med deltagare.',
    category: 'Team Hub', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    endpoint: '/api/meetings?limit=1000&offset=0',
  },
  {
    id: 'announcements-export', name: 'Meddelanden',
    desc: 'Alla organisationens annonseringar och nyheter.',
    category: 'Team Hub', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
    endpoint: '/api/announcements?limit=1000&offset=0',
  },
];

function flattenForCsv(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenForCsv(val as Record<string, unknown>, fullKey));
    } else if (Array.isArray(val)) {
      result[fullKey] = val.join('; ');
    } else {
      result[fullKey] = val == null ? '' : String(val);
    }
  }
  return result;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return 'No data';
  const flat    = rows.map(r => flattenForCsv(r));
  const headers = Array.from(new Set(flat.flatMap(r => Object.keys(r))));
  return [
    headers.join(','),
    ...flat.map(r => headers.map(h => `"${(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState<string | null>(null);

  const generate = async (report: Report) => {
    setGenerating(report.id);
    setError(null);
    setSuccess(null);
    try {
      const rows = await loadReportRows(report.endpoint);
      const csv = toCsv(rows);
      downloadCsv(csv, `${report.id}-${new Date().toISOString().slice(0, 10)}.csv`);
      setSuccess(`"${report.name}" laddades ned — ${rows.length} rader.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-1">Rapporter</h1>
          <p className="text-sm text-[var(--text-muted)]">Generera och ladda ner strukturerade CSV-rapporter för analys och revision.</p>
        </div>
      </div>

      {/* Banners */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 flex items-center justify-between gap-3">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Report grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => (
          <div key={r.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <span className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${r.color}`}>
                {r.category}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] shrink-0 mt-0.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">{r.name}</p>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{r.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => void generate(r)}
              disabled={!!generating}
              className="mt-auto text-xs font-medium text-[var(--accent)] hover:underline disabled:opacity-50 transition-opacity text-left"
            >
              {generating === r.id ? 'Genererar…' : 'Generera rapport →'}
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

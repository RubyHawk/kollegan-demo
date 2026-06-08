'use client';

import { useState } from 'react';
import { Download, X } from 'lucide-react';
import {
  loadAnnouncementsReportRows,
  loadContactsReportRows,
  loadLeadsReportRows,
  loadMeetingsReportRows,
  loadOffersReportRows,
  loadProjectsReportRows,
  type ReportRowsLoader,
} from '@shared/lib/api/reports.api';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { InlineAlert } from '@shared/ui/inline-alert';
import { PageHeader } from '@shared/ui/page-header';
import { Panel } from '@shared/ui/panel';

type ReportTone = 'neutral' | 'accent' | 'success' | 'warning' | 'info' | 'danger';

interface Report {
  id: string;
  name: string;
  desc: string;
  category: string;
  tone: ReportTone;
  loadRows: ReportRowsLoader;
}

const REPORTS: Report[] = [
  {
    id: 'contacts-export',
    name: 'Kontaktexport',
    desc: 'Fullständig export av alla kunder och kontakter med historik.',
    category: 'CRM',
    tone: 'accent',
    loadRows: loadContactsReportRows,
  },
  {
    id: 'leads-export',
    name: 'Leadsexport',
    desc: 'Alla leads med status, källa, poäng och estimerat värde.',
    category: 'CRM',
    tone: 'info',
    loadRows: loadLeadsReportRows,
  },
  {
    id: 'offers-export',
    name: 'Offertöversikt',
    desc: 'Alla offerter med status, mottagare och totalsummor.',
    category: 'Försäljning',
    tone: 'warning',
    loadRows: loadOffersReportRows,
  },
  {
    id: 'projects-export',
    name: 'Projektöversikt',
    desc: 'Status, framsteg och milstolpar för alla aktiva projekt.',
    category: 'Projekt',
    tone: 'success',
    loadRows: loadProjectsReportRows,
  },
  {
    id: 'meetings-export',
    name: 'Mötesexport',
    desc: 'Alla schemalagda och genomförda möten med deltagare.',
    category: 'Team Hub',
    tone: 'info',
    loadRows: loadMeetingsReportRows,
  },
  {
    id: 'announcements-export',
    name: 'Meddelanden',
    desc: 'Alla organisationens annonseringar och nyheter.',
    category: 'Team Hub',
    tone: 'danger',
    loadRows: loadAnnouncementsReportRows,
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
  const flat = rows.map((row) => flattenForCsv(row));
  const headers = Array.from(new Set(flat.flatMap((row) => Object.keys(row))));

  return [
    headers.join(','),
    ...flat.map((row) => headers.map((header) => `"${(row[header] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const generate = async (report: Report) => {
    setGenerating(report.id);
    setError(null);
    setSuccess(null);

    try {
      const rows = await report.loadRows();
      const csv = toCsv(rows);
      downloadCsv(csv, `${report.id}-${new Date().toISOString().slice(0, 10)}.csv`);
      setSuccess(`"${report.name}" laddades ned, ${rows.length} rader.`);
    } catch {
      setError('Kunde inte ladda rapporten. Kontrollera anslutningen och försök igen.');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Rapporter"
        description="Generera strukturerade CSV-rapporter för analys och revision."
      />

      <div className="space-y-3" aria-live="polite">
        {error ? (
          <InlineAlert tone="danger">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label="Stäng felmeddelande"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--ui-danger-border)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
              >
                <X size={16} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          </InlineAlert>
        ) : null}

        {success ? (
          <InlineAlert tone="success">
            <div className="flex items-center justify-between gap-3">
              <span>{success}</span>
              <button
                type="button"
                onClick={() => setSuccess(null)}
                aria-label="Stäng bekräftelse"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--ui-success-border)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:ring-offset-2"
              >
                <X size={16} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          </InlineAlert>
        ) : null}
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <Panel key={report.id} padding="lg" className="flex min-h-[188px] flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <Badge variant={report.tone}>{report.category}</Badge>
              <Download size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[var(--ui-text-muted)]" aria-hidden />
            </div>

            <div className="min-w-0 space-y-1">
              <h2 className="text-sm font-semibold text-[var(--ui-text)]">{report.name}</h2>
              <p className="text-sm leading-6 text-[var(--ui-text-muted)]">{report.desc}</p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="compact"
              loading={generating === report.id}
              disabled={generating !== null}
              onClick={() => void generate(report)}
              className="mt-auto justify-start"
            >
              {generating === report.id ? 'Genererar...' : 'Generera rapport'}
            </Button>
          </Panel>
        ))}
      </section>
    </div>
  );
}
